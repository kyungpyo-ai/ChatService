-- 일자별 지표 조회 — 방채팅/랜덤채팅 대시보드의 "오늘" 지표들을 날짜 범위로 재집계한다.
-- DAU만 daily_active_users(별도 보존 로그)에서 가져오고, 나머지는 원본 테이블이 타임스탬프를
-- 영구 보존하므로 그때그때 재집계한다.
create or replace function public.admin_get_daily_stats(p_date_from date, p_date_to date)
returns table (
  stat_date date,
  dau bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  room_messages bigint,
  random_messages bigint
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
    gs.day::date,
    coalesce(dau.cnt, 0),
    coalesce(rc.cnt, 0),
    coalesce(rd.cnt, 0),
    coalesce(rm.cnt, 0),
    coalesce(sm.cnt, 0)
  from generate_series(p_date_from::timestamp, p_date_to::timestamp, interval '1 day') as gs(day)
  left join (
    select activity_date, count(*) as cnt
    from public.daily_active_users
    group by activity_date
  ) dau on dau.activity_date = gs.day::date
  left join (
    select created_at::date as day, count(*) as cnt
    from public.rooms
    group by created_at::date
  ) rc on rc.day = gs.day::date
  left join (
    select archived_at::date as day, count(*) as cnt
    from public.room_archives
    group by archived_at::date
  ) rd on rd.day = gs.day::date
  left join (
    select created_at::date as day, count(*) as cnt
    from public.messages
    where room_id is not null
    group by created_at::date
  ) rm on rm.day = gs.day::date
  left join (
    select created_at::date as day, count(*) as cnt
    from public.messages
    where session_id is not null
    group by created_at::date
  ) sm on sm.day = gs.day::date
  order by gs.day;
end;
$$;
