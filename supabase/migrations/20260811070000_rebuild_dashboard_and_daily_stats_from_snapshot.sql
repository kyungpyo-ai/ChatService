-- admin_get_dashboard_stats()는 공용 헬퍼(admin_compute_live_stats)를 재사용하도록 정리한다
-- (반환 타입은 그대로라 drop 불필요).
create or replace function public.admin_get_dashboard_stats()
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
  active_random_sessions bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_messages_today bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  -- admin_compute_live_stats()의 반환 컬럼명이 이 함수의 OUT 파라미터명과 겹쳐서 별칭 없이
  -- 참조하면 "column reference is ambiguous"(42702) 에러가 난다 — 반드시 별칭을 붙여야 한다.
  return query
  select
    t.total_users, t.dau, t.guest_count, t.online_count, t.pending_reports,
    t.rooms_created, t.rooms_deleted, t.active_rooms, t.room_messages,
    t.active_random_sessions, t.random_active_participants, t.random_queue_waiting_count,
    t.random_messages
  from public.admin_compute_live_stats() as t;
end;
$$;

-- admin_get_daily_stats()를 대시보드 전체 지표로 확장 — 과거 날짜는 admin_daily_stats
-- 스냅샷에서, 오늘(아직 스냅샷이 찍히지 않은 진행 중인 날)은 admin_compute_live_stats()로
-- 실시간 계산해 채운다. 스냅샷이 없는 과거 날짜(이 기능 도입 이전)는 NULL로 남겨
-- "그날 값이 0이었다"와 "그날은 집계하지 않았다"를 구분한다.
-- 반환 컬럼 구성이 바뀌므로 기존 함수를 먼저 제거해야 한다.
drop function if exists public.admin_get_daily_stats(date, date);

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
  active_random_sessions bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_messages bigint,
  online_count bigint
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
    case when gs.day::date = current_date then v_live.active_random_sessions else s.active_random_sessions end,
    case when gs.day::date = current_date then v_live.random_active_participants
      else s.random_active_participants end,
    case when gs.day::date = current_date then v_live.random_queue_waiting_count
      else s.random_queue_waiting_count end,
    case when gs.day::date = current_date then v_live.random_messages else s.random_messages end,
    case when gs.day::date = current_date then v_live.online_count else s.online_count end
  from generate_series(p_date_from::timestamp, p_date_to::timestamp, interval '1 day') as gs(day)
  left join public.admin_daily_stats s on s.stat_date = gs.day::date
  order by gs.day;
end;
$$;
