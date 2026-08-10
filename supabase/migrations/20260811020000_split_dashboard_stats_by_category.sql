-- 대시보드 지표를 기본 정보/방채팅/랜덤채팅 카테고리로 재구성
-- - 방/랜덤채팅 각각의 "오늘 메시지 수"를 messages.room_id / session_id 기준으로 분리
-- - "오늘 새로 생긴 방"(rooms.created_at), "오늘 삭제된 방"(room_archives.archived_at,
--   archive_room_before_delete 트리거가 모든 삭제 경로에서 항상 스냅샷을 남기므로 정확함) 추가
drop function if exists public.admin_get_dashboard_stats();

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
    (select count(*) from public.profiles where last_seen_at > now() - interval '24 hours'),
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
