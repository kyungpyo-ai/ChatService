-- 대시보드 DAU를 "가입 회원만의 rolling 24h" 대신 daily_active_users 기반
-- "오늘(캘린더 일자) 서비스 전체 이용자 수(정회원+게스트)"로 교체한다.
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

  return query select
    (select count(*) from public.profiles),
    (select count(*) from public.daily_active_users where activity_date = current_date),
    (select count(*) from public.guest_profiles),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes'),
    (select count(*) from public.reports where status = 'pending'),
    (select count(*) from public.rooms where created_at > date_trunc('day', now())),
    (select count(*) from public.room_archives where archived_at > date_trunc('day', now())),
    (select count(*) from public.rooms),
    (select count(*) from public.messages
      where room_id is not null and created_at > date_trunc('day', now())),
    (select count(*) from public.random_sessions where status = 'active'),
    (select count(*) from public.random_sessions where status = 'active') * 2,
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds'),
    (select count(*) from public.messages
      where session_id is not null and created_at > date_trunc('day', now()));
end;
$$;
