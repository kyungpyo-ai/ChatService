-- 일자별 이용자 수 추적 인프라
--
-- profiles/guest_profiles.last_seen_at은 하트비트마다 덮어써지므로 과거 날짜의 DAU를
-- 복원할 수 없다. 날짜별 고유 이용자를 영구 보존하려면 별도의 append-only 로그가 필요하다.
-- 그 외 지표(신규 방, 삭제된 방, 메시지 수 등)는 원본 테이블이 타임스탬프를 영구 보존하므로
-- 별도 저장 없이 언제든 기간별로 재집계 가능하다 — 이 테이블은 DAU 전용이다.
create table public.daily_active_users (
  activity_date date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_guest boolean not null,
  primary key (activity_date, user_id)
);

alter table public.daily_active_users enable row level security;

-- 클라이언트는 이 테이블에 직접 접근하지 않는다 — 기록은 record_daily_activity() RPC
-- (SECURITY DEFINER, RLS 우회)를 통해서만, 조회는 관리자 RPC를 통해서만 이뤄진다.
revoke insert, update, delete on public.daily_active_users from authenticated;

-- 로그인 사용자(정회원/게스트)의 하트비트 시점에 "오늘 활동했다"는 사실만 1행 기록한다.
-- app/actions/heartbeat.ts의 updateLastSeenAction()에서 last_seen_at 갱신과 함께 호출된다.
create or replace function public.record_daily_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  insert into public.daily_active_users (activity_date, user_id, is_guest)
  values (
    current_date,
    v_uid,
    exists(select 1 from public.guest_profiles where id = v_uid)
  )
  on conflict (activity_date, user_id) do nothing;
end;
$$;

revoke all on function public.record_daily_activity() from public;
grant execute on function public.record_daily_activity() to authenticated;

-- 보존 기한 — 이 테이블은 기간별 비교/트렌드 조회가 목적이라 다른 아카이브(30일)보다
-- 훨씬 길게 유지한다. 행 하나가 "이용자 1명 x 1일"이라 용량 부담이 크지 않다(13개월).
create or replace function public.cleanup_old_daily_active_users()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.daily_active_users where activity_date < current_date - interval '400 days';
$$;

revoke all on function public.cleanup_old_daily_active_users() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-old-daily-active-users') then
    perform cron.schedule(
      'cleanup-old-daily-active-users',
      '0 3 * * *',
      $job$select public.cleanup_old_daily_active_users()$job$
    );
  end if;
end $$;
