-- 관리자 대시보드/일자별 통계 개편 (§사용자 요청)
--
-- 1) 탈퇴 회원 집계: deleteAccountAction(자진 탈퇴)/forceDeleteAccountAction(관리자 강제 탈퇴)
--    모두 최종적으로 auth.admin.deleteUser()를 호출해 auth.users 행을 물리 삭제한다
--    (app/actions/profile.ts, app/actions/admin.ts). profiles는 on delete cascade로 함께
--    삭제되므로 탈퇴 이력이 전혀 남지 않는다 — "오늘 탈퇴한 회원 수"를 집계하려면 삭제 시점에
--    별도로 로그를 남겨야 한다. auth.users에 AFTER DELETE 트리거를 다는 방식은 이미 이
--    프로젝트가 handle_new_user()(AFTER INSERT, §20260726000000)로 쓰고 있는 패턴이라
--    일관성 있게 재사용한다. 삭제 경로(자진/강제)와 무관하게 auth.users 삭제 한 지점만
--    가로채면 되므로 안전하다.
--
--    account_deletions.user_id는 auth.users를 FK로 참조하지 않는다 — 참조하면 "탈퇴 대상
--    행이 아직 존재하는 시점(BEFORE)"에는 기록해도 이후 실제 삭제가 FK 위반으로 막히고,
--    "이미 삭제된 시점(AFTER)"에는 참조 대상이 없어 FK 자체가 성립하지 않는다. 단순 집계용
--    로그이므로 참조 무결성 없이 id 값만 보관한다.
create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  deleted_at timestamptz not null default now()
);

create index account_deletions_deleted_at_idx on public.account_deletions (deleted_at desc);

alter table public.account_deletions enable row level security;
revoke all on public.account_deletions from public, anon, authenticated;

create policy "admins can view account deletions"
  on public.account_deletions for select to authenticated
  using (public.is_admin());

create function public.log_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_deletions (user_id, deleted_at) values (old.id, now());
  return old;
end;
$$;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.log_account_deletion();

-- 트리거 전용 함수 — REST API(RPC)를 통한 직접 호출은 차단 (handle_new_user와 동일 컨벤션)
revoke execute on function public.log_account_deletion() from public, anon, authenticated;

-- 2) 대시보드/일자별 통계 지표 재구성
--    - 화면에서 완전히 빠지는 지표(방채팅/랜덤채팅 메시지 수)는 admin_compute_live_stats()
--      에서도 제거한다 — 대시보드 카드도 없어지고 /admin/stats 컬럼에서도 빠지므로 어디서도
--      소비하지 않는 값이 된다.
--    - guest_count/pending_reports/dau/random_active_participants/random_queue_waiting_count/
--      online_count는 대시보드 "현재 상태"/"오늘의 활동" 섹션이 여전히 라이브 값으로
--      보여주므로 admin_compute_live_stats()/admin_get_dashboard_stats()에는 남기지만,
--      /admin/stats(admin_get_daily_stats)는 요청된 7개 지표만 반환하도록 줄이므로 이 값들을
--      admin_daily_stats 스냅샷 테이블에 저장할 이유가 없어졌다 — 테이블도 함께 정리한다.
--    - 신규 회원(profiles.created_at 기준)/탈퇴 회원(account_deletions.deleted_at 기준)을
--      새로 추가한다.
delete from public.admin_daily_stats;

drop function if exists public.admin_get_daily_stats(date, date) cascade;
drop function if exists public.admin_get_dashboard_stats() cascade;
drop function if exists public.record_daily_stats_snapshot() cascade;
drop function if exists public.admin_compute_live_stats() cascade;

alter table public.admin_daily_stats
  drop column guest_count,
  drop column pending_reports,
  drop column dau,
  drop column room_messages,
  drop column random_active_participants,
  drop column random_queue_waiting_count,
  drop column random_messages,
  drop column online_count,
  add column new_users bigint not null,
  add column deleted_users bigint not null;

create function public.admin_compute_live_stats()
returns table (
  total_users bigint,
  guest_count bigint,
  pending_reports bigint,
  dau bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  active_rooms bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  online_count bigint,
  random_sessions_matched bigint,
  new_users bigint,
  deleted_users bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.guest_profiles),
    (select count(*) from public.reports where status = 'pending'),
    (select count(*) from public.daily_active_users where activity_date = current_date),
    (select count(*) from public.rooms where created_at > date_trunc('day', now())),
    (select count(*) from public.room_archives where archived_at > date_trunc('day', now())),
    (select count(*) from public.rooms),
    (select count(*) from public.random_sessions where status = 'active') * 2,
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds'),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes'),
    (select count(*) from public.random_sessions where started_at > date_trunc('day', now()))
      + (select count(*) from public.random_session_archives
          where started_at > date_trunc('day', now())),
    (select count(*) from public.profiles where created_at > date_trunc('day', now())),
    (select count(*) from public.account_deletions where deleted_at > date_trunc('day', now()));
$$;

revoke all on function public.admin_compute_live_stats() from public, anon, authenticated;

create function public.record_daily_stats_snapshot()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_daily_stats (
    stat_date, total_users, new_users, deleted_users, rooms_created, rooms_deleted,
    active_rooms, random_sessions_matched
  )
  select
    current_date, total_users, new_users, deleted_users, rooms_created, rooms_deleted,
    active_rooms, random_sessions_matched
  from public.admin_compute_live_stats()
  on conflict (stat_date) do update set
    total_users = excluded.total_users,
    new_users = excluded.new_users,
    deleted_users = excluded.deleted_users,
    rooms_created = excluded.rooms_created,
    rooms_deleted = excluded.rooms_deleted,
    active_rooms = excluded.active_rooms,
    random_sessions_matched = excluded.random_sessions_matched,
    recorded_at = now();
end;
$$;

revoke all on function public.record_daily_stats_snapshot() from public, anon, authenticated;

create function public.admin_get_dashboard_stats()
returns table (
  total_users bigint,
  dau bigint,
  guest_count bigint,
  online_count bigint,
  pending_reports bigint,
  rooms_created_today bigint,
  rooms_deleted_today bigint,
  active_rooms bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_sessions_matched_today bigint,
  new_users_today bigint,
  deleted_users_today bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  return query
  select
    t.total_users, t.dau, t.guest_count, t.online_count, t.pending_reports,
    t.rooms_created, t.rooms_deleted, t.active_rooms,
    t.random_active_participants, t.random_queue_waiting_count, t.random_sessions_matched,
    t.new_users, t.deleted_users
  from public.admin_compute_live_stats() as t;
end;
$$;

create function public.admin_get_daily_stats(p_date_from date, p_date_to date)
returns table (
  stat_date date,
  total_users bigint,
  new_users bigint,
  deleted_users bigint,
  active_rooms bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  random_sessions_matched bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_live record;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_live from public.admin_compute_live_stats();

  return query
  select
    gs.day::date,
    case when gs.day::date = current_date then v_live.total_users else s.total_users end,
    case when gs.day::date = current_date then v_live.new_users else s.new_users end,
    case when gs.day::date = current_date then v_live.deleted_users else s.deleted_users end,
    case when gs.day::date = current_date then v_live.active_rooms else s.active_rooms end,
    case when gs.day::date = current_date then v_live.rooms_created else s.rooms_created end,
    case when gs.day::date = current_date then v_live.rooms_deleted else s.rooms_deleted end,
    case when gs.day::date = current_date then v_live.random_sessions_matched
      else s.random_sessions_matched end
  from generate_series(p_date_from::timestamp, p_date_to::timestamp, interval '1 day') as gs(day)
  left join public.admin_daily_stats s on s.stat_date = gs.day::date
  order by gs.day;
end;
$$;
