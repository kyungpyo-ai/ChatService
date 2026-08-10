-- 대시보드에 랜덤채팅 매칭 대기 중 인원 추가
-- random_queue.last_seen_at은 대기 화면의 5초 폴링(match_or_wait 재호출)마다 갱신되며,
-- 매칭 후보 판정에도 이미 15초 이내를 "살아있는 대기자" 기준으로 쓰고 있다
-- (20260805060000, 20260806010000, 20260806000000, 20260810060000와 동일 기준 재사용).
drop function if exists public.admin_get_dashboard_stats();

create function public.admin_get_dashboard_stats()
returns table (
  total_users bigint,
  dau bigint,
  active_rooms bigint,
  active_random_sessions bigint,
  messages_today bigint,
  pending_reports bigint,
  guest_count bigint,
  online_count bigint,
  random_queue_waiting_count bigint
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
    (select count(*) from public.rooms),
    (select count(*) from public.random_sessions where status = 'active'),
    (select count(*) from public.messages where created_at > date_trunc('day', now())),
    (select count(*) from public.reports where status = 'pending'),
    (select count(*) from public.guest_profiles),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes'),
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds');
end;
$$;
