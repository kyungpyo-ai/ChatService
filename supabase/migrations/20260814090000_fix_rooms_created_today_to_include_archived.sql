-- "신규 방채팅"(rooms_created)이 현재 존재하는 방만 세고 있어, 같은 날 만들었다가
-- 삭제한 방은 카운트에서 빠지는 문제를 수정한다(§사용자 요청). rooms_deleted가 이미
-- 쓰고 있는 append-only room_archives를 함께 합산해, 삭제 여부와 무관하게 "오늘 생성된
-- 방 수"가 유지되도록 한다(random_sessions_matched가 이미 쓰는 활성+아카이브 합산 패턴과 동일).
drop function if exists public.admin_get_dashboard_stats();
drop function if exists public.admin_get_daily_stats(date, date);
drop function if exists public.record_daily_stats_snapshot();
drop function if exists public.admin_compute_live_stats();

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
    (select count(*) from public.rooms where created_at > date_trunc('day', now()))
      + (select count(*) from public.room_archives where created_at > date_trunc('day', now())),
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
