-- 대시보드에 보이는 모든 지표를 일자 단위로 저장해 나중에 기간별 비교가 가능하게 한다.
--
-- "오늘 새로 생긴 방" 같은 흐름(flow) 지표는 원본 테이블이 타임스탬프를 영구 보존하므로
-- 그때그때 재집계해도 과거 값이 정확하지만, "진행 중인 방 수"/"실시간 접속자" 같은 스냅샷
-- (stock) 지표는 그 순간의 상태만 존재해서 특정 시점에 찍어두지 않으면 과거 값을 복원할 수
-- 없다. 그래서 대시보드에 보이는 지표 전체를 매일 자정 직전 한 번씩 스냅샷으로 저장한다.
-- 30일 아카이브(방/랜덤채팅 대화 내용)와 달리 이 테이블은 트렌드 비교가 목적이라 만료시키지
-- 않는다 — 행 하나가 "일자 1개"라 용량 부담이 거의 없다.
create table public.admin_daily_stats (
  stat_date date primary key,
  total_users bigint not null,
  guest_count bigint not null,
  pending_reports bigint not null,
  dau bigint not null,
  rooms_created bigint not null,
  rooms_deleted bigint not null,
  active_rooms bigint not null,
  room_messages bigint not null,
  active_random_sessions bigint not null,
  random_active_participants bigint not null,
  random_queue_waiting_count bigint not null,
  random_messages bigint not null,
  online_count bigint not null,
  recorded_at timestamptz not null default now()
);

alter table public.admin_daily_stats enable row level security;
revoke all on public.admin_daily_stats from public, anon, authenticated;

create policy "admins can view daily stats"
  on public.admin_daily_stats for select to authenticated
  using (public.is_admin());

-- admin_get_dashboard_stats()/admin_get_daily_stats()/record_daily_stats_snapshot()가 공유하는
-- "지금 이 순간" 계산 로직 — 세 곳에서 각자 다시 쓰면 하나만 고치고 잊어버리기 쉬워 함수로 뺐다.
-- public/anon/authenticated에는 실행 권한을 주지 않는다 — SECURITY DEFINER 함수는 소유자 권한으로
-- 실행되므로 여기서 호출하는 다른 SECURITY DEFINER 함수들은 REVOKE와 무관하게 계속 호출 가능하다.
create or replace function public.admin_compute_live_stats()
returns table (
  total_users bigint,
  guest_count bigint,
  pending_reports bigint,
  dau bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  active_rooms bigint,
  room_messages bigint,
  active_random_sessions bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_messages bigint,
  online_count bigint
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
    (select count(*) from public.messages
      where room_id is not null and created_at > date_trunc('day', now())),
    (select count(*) from public.random_sessions where status = 'active'),
    (select count(*) from public.random_sessions where status = 'active') * 2,
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds'),
    (select count(*) from public.messages
      where session_id is not null and created_at > date_trunc('day', now())),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes');
$$;

revoke all on function public.admin_compute_live_stats() from public, anon, authenticated;

-- 매일 23:55에 그 시점까지의 하루치 지표를 admin_daily_stats에 upsert한다. 같은 날 두 번 이상
-- 실행돼도(수동 재실행 등) on conflict로 안전하게 덮어쓴다.
create or replace function public.record_daily_stats_snapshot()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_daily_stats (
    stat_date, total_users, guest_count, pending_reports, dau, rooms_created, rooms_deleted,
    active_rooms, room_messages, active_random_sessions, random_active_participants,
    random_queue_waiting_count, random_messages, online_count
  )
  select
    current_date, total_users, guest_count, pending_reports, dau, rooms_created, rooms_deleted,
    active_rooms, room_messages, active_random_sessions, random_active_participants,
    random_queue_waiting_count, random_messages, online_count
  from public.admin_compute_live_stats()
  on conflict (stat_date) do update set
    total_users = excluded.total_users,
    guest_count = excluded.guest_count,
    pending_reports = excluded.pending_reports,
    dau = excluded.dau,
    rooms_created = excluded.rooms_created,
    rooms_deleted = excluded.rooms_deleted,
    active_rooms = excluded.active_rooms,
    room_messages = excluded.room_messages,
    active_random_sessions = excluded.active_random_sessions,
    random_active_participants = excluded.random_active_participants,
    random_queue_waiting_count = excluded.random_queue_waiting_count,
    random_messages = excluded.random_messages,
    online_count = excluded.online_count,
    recorded_at = now();
end;
$$;

revoke all on function public.record_daily_stats_snapshot() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'record-daily-stats-snapshot') then
    perform cron.schedule(
      'record-daily-stats-snapshot',
      '55 23 * * *',
      $job$select public.record_daily_stats_snapshot()$job$
    );
  end if;
end $$;
