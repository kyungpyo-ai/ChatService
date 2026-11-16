-- 관리자 통계 정확도 수정 (2026-11-16, 실사용 중 발견)
--
-- 1) "오늘" 기준을 한국 시간(KST) 자정으로 변경
--    기존 통계 함수는 current_date / date_trunc('day', now())를 써서 DB 세션 시간대(UTC)
--    기준으로 하루를 나눴다 — 즉 "오늘"이 한국 시간 오전 9시에 시작되어, 새벽 0~9시에 보는
--    대시보드에는 전날 9시 이후 기록이 섞였다. kst_today()/kst_day_start() 헬퍼로 통일한다.
--    일별 스냅샷 크론도 UTC 23:55(=KST 08:55) → UTC 14:55(=KST 23:55)로 옮긴다.
--    ※ 이 마이그레이션 이전에 쌓인 admin_daily_stats 행은 UTC 하루 기준 값으로 남는다.
--
-- 2) 탈퇴 회원 집계에서 게스트(익명) 계정 제외
--    on_auth_user_deleted 트리거가 auth.users 삭제를 전부 account_deletions에 기록해,
--    cleanup-stale-anonymous-users 크론이 6시간마다 지우는 랜덤채팅 게스트 계정까지
--    "탈퇴 회원"으로 집계되고 있었다(2026-11-16 21:00 KST 한 번에 15건). 익명 계정은
--    기록하지 않는다. 기존에 쌓인 기록은 이미 계정이 지워져 회원/게스트를 구분할 수 없어 그대로 둔다.

-- ── 헬퍼: 한국 시간 기준 오늘 날짜 / 오늘 0시(timestamptz) ──
create or replace function public.kst_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;

create or replace function public.kst_day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
$$;

revoke all on function public.kst_today() from public, anon, authenticated;
revoke all on function public.kst_day_start() from public, anon, authenticated;

-- ── 2) 게스트 계정 삭제는 탈퇴 기록에서 제외 ──
create or replace function public.log_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(old.is_anonymous, false) then
    return old;
  end if;

  insert into public.account_deletions (user_id, deleted_at) values (old.id, now());
  return old;
end;
$$;

revoke execute on function public.log_account_deletion() from public, anon, authenticated;

-- ── 1) 통계 함수들을 KST 기준으로 재정의 (시그니처/반환 타입은 그대로) ──
create or replace function public.admin_compute_live_stats()
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
    (select count(*) from public.daily_active_users where activity_date = public.kst_today()),
    (select count(*) from public.rooms where created_at > public.kst_day_start())
      + (select count(*) from public.room_archives where created_at > public.kst_day_start()),
    (select count(*) from public.room_archives where archived_at > public.kst_day_start()),
    (select count(*) from public.rooms),
    (select count(*) from public.random_sessions where status = 'active') * 2,
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds'),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes'),
    (select count(*) from public.random_sessions where started_at > public.kst_day_start())
      + (select count(*) from public.random_session_archives
          where started_at > public.kst_day_start()),
    (select count(*) from public.profiles where created_at > public.kst_day_start()),
    (select count(*) from public.account_deletions where deleted_at > public.kst_day_start());
$$;

revoke all on function public.admin_compute_live_stats() from public, anon, authenticated;

create or replace function public.admin_get_daily_stats(p_date_from date, p_date_to date)
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
  v_today date := public.kst_today();
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_live from public.admin_compute_live_stats();

  return query
  select
    gs.day::date,
    case when gs.day::date = v_today then v_live.total_users else s.total_users end,
    case when gs.day::date = v_today then v_live.new_users else s.new_users end,
    case when gs.day::date = v_today then v_live.deleted_users else s.deleted_users end,
    case when gs.day::date = v_today then v_live.active_rooms else s.active_rooms end,
    case when gs.day::date = v_today then v_live.rooms_created else s.rooms_created end,
    case when gs.day::date = v_today then v_live.rooms_deleted else s.rooms_deleted end,
    case when gs.day::date = v_today then v_live.random_sessions_matched
      else s.random_sessions_matched end
  from generate_series(p_date_from::timestamp, p_date_to::timestamp, interval '1 day') as gs(day)
  left join public.admin_daily_stats s on s.stat_date = gs.day::date
  order by gs.day;
end;
$$;

create or replace function public.record_daily_stats_snapshot()
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
    public.kst_today(), total_users, new_users, deleted_users, rooms_created, rooms_deleted,
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

-- DAU 기록도 KST 날짜로 (하트비트에서 호출)
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
    public.kst_today(),
    v_uid,
    exists(select 1 from public.guest_profiles where id = v_uid)
  )
  on conflict (activity_date, user_id) do nothing;
end;
$$;

revoke all on function public.record_daily_activity() from public;
grant execute on function public.record_daily_activity() to authenticated;

-- 일별 스냅샷을 KST 23:55(= UTC 14:55)에 기록 — pg_cron 스케줄은 UTC 기준이다.
-- 같은 이름으로 다시 schedule하면 기존 잡의 스케줄이 갱신된다.
select cron.schedule(
  'record-daily-stats-snapshot',
  '55 14 * * *',
  $job$select public.record_daily_stats_snapshot()$job$
);
