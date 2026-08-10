-- 대시보드에 사이트 전체 실시간 접속자 수 추가
-- 기존 온라인 판정 기준(lib/queries/users.ts의 ONLINE_THRESHOLD_MS = 2분, 하트비트 주기 60초)과
-- 동일하게 last_seen_at 2분 이내인 profiles + guest_profiles 합산으로 정의한다.
-- 반환 타입(OUT 파라미터 구성)이 바뀌므로 기존 함수를 먼저 제거해야 한다.
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
  online_count bigint
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
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes');
end;
$$;
