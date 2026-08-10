-- "진행 중인 랜덤 세션"(active_random_sessions)은 "실시간 매칭자"(그 값 x2)와 사실상 같은
-- 정보를 세션 단위/인원 단위로 중복 표시할 뿐이라 제거하고, 대신 "오늘 매칭된 랜덤채팅
-- 세션 수"(하루 동안 새로 성사된 매칭 건수, flow 지표)를 추가한다.
--
-- 오늘 매칭된 세션 수 = 아직 진행 중인 세션(random_sessions) + 오늘 이미 종료·아카이브된
-- 세션(random_session_archives) 중 started_at이 오늘인 것의 합. 세션이 종료되면
-- random_sessions에서 삭제되고 random_session_archives로 트리거 이관되므로(20260808040000)
-- 두 테이블에 동시에 존재하지 않아 중복 집계가 없다.
--
-- admin_compute_live_stats()의 반환 타입(OUT 파라미터 구성)이 바뀌므로, 이를 호출하는
-- 함수들과 함께 cascade로 정리 후 순서대로(헬퍼 → 그 헬퍼를 쓰는 함수들) 다시 만든다.

-- 아직 실사용 전(테스트로 남은 오늘자 스냅샷 행만 존재)이라 컬럼 교체를 위해 비운다.
delete from public.admin_daily_stats;

alter table public.admin_daily_stats
  drop column active_random_sessions,
  add column random_sessions_matched bigint not null;

drop function if exists public.admin_get_daily_stats(date, date) cascade;
drop function if exists public.admin_get_dashboard_stats() cascade;
drop function if exists public.record_daily_stats_snapshot() cascade;
drop function if exists public.admin_compute_live_stats() cascade;

create function public.admin_compute_live_stats()
returns table (
  total_users bigint,
  guest_count bigint,
  pending_reports bigint,
  dau bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  active_rooms bigint,
  room_messages bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_messages bigint,
  online_count bigint,
  random_sessions_matched bigint
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
    (select count(*) from public.random_sessions where status = 'active') * 2,
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds'),
    (select count(*) from public.messages
      where session_id is not null and created_at > date_trunc('day', now())),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes'),
    (select count(*) from public.random_sessions where started_at > date_trunc('day', now()))
      + (select count(*) from public.random_session_archives
          where started_at > date_trunc('day', now()));
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
    stat_date, total_users, guest_count, pending_reports, dau, rooms_created, rooms_deleted,
    active_rooms, room_messages, random_active_participants,
    random_queue_waiting_count, random_messages, online_count, random_sessions_matched
  )
  select
    current_date, total_users, guest_count, pending_reports, dau, rooms_created, rooms_deleted,
    active_rooms, room_messages, random_active_participants,
    random_queue_waiting_count, random_messages, online_count, random_sessions_matched
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
    random_active_participants = excluded.random_active_participants,
    random_queue_waiting_count = excluded.random_queue_waiting_count,
    random_messages = excluded.random_messages,
    online_count = excluded.online_count,
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
  room_messages_today bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_messages_today bigint,
  random_sessions_matched_today bigint
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
    t.rooms_created, t.rooms_deleted, t.active_rooms, t.room_messages,
    t.random_active_participants, t.random_queue_waiting_count, t.random_messages,
    t.random_sessions_matched
  from public.admin_compute_live_stats() as t;
end;
$$;

create function public.admin_get_daily_stats(p_date_from date, p_date_to date)
returns table (
  stat_date date,
  total_users bigint,
  guest_count bigint,
  pending_reports bigint,
  dau bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  active_rooms bigint,
  room_messages bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_messages bigint,
  online_count bigint,
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
    case when gs.day::date = current_date then v_live.guest_count else s.guest_count end,
    case when gs.day::date = current_date then v_live.pending_reports else s.pending_reports end,
    case when gs.day::date = current_date then v_live.dau else s.dau end,
    case when gs.day::date = current_date then v_live.rooms_created else s.rooms_created end,
    case when gs.day::date = current_date then v_live.rooms_deleted else s.rooms_deleted end,
    case when gs.day::date = current_date then v_live.active_rooms else s.active_rooms end,
    case when gs.day::date = current_date then v_live.room_messages else s.room_messages end,
    case when gs.day::date = current_date then v_live.random_active_participants
      else s.random_active_participants end,
    case when gs.day::date = current_date then v_live.random_queue_waiting_count
      else s.random_queue_waiting_count end,
    case when gs.day::date = current_date then v_live.random_messages else s.random_messages end,
    case when gs.day::date = current_date then v_live.online_count else s.online_count end,
    case when gs.day::date = current_date then v_live.random_sessions_matched
      else s.random_sessions_matched end
  from generate_series(p_date_from::timestamp, p_date_to::timestamp, interval '1 day') as gs(day)
  left join public.admin_daily_stats s on s.stat_date = gs.day::date
  order by gs.day;
end;
$$;
