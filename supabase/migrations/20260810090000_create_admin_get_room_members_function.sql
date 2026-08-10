-- Phase 7.5 구현 중 발견 — 관리자가 참여자가 아닌 방의 참여자 목록을 볼 수 없는 문제 보완
--
-- room_members SELECT RLS(§DB_SCHEMA 4)는 "같은 방 참여자만" 조회를 허용하므로, 관리자가
-- 참여하지 않은 방은 admin_search_rooms()로 목록은 봐도 참여자 상세는 볼 수 없었다.
-- DEVELOPMENT_PLAN.md §7.5.4에는 명시적으로 나열되어 있지 않았지만 "방별 메시지 타임라인 +
-- 참여자 목록"(ROADMAP.md Phase 7.5 대화 내용 조회) 요구사항을 채우려면 필요해 추가한다.
create or replace function public.admin_get_room_members(p_room_id uuid)
returns table (
  user_id uuid,
  nickname text,
  avatar_url text,
  role text,
  joined_at timestamptz
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
  select rm.user_id, p.username, p.avatar_url, rm.role, rm.joined_at
  from public.room_members rm
  left join public.profiles p on p.id = rm.user_id
  where rm.room_id = p_room_id
  order by rm.joined_at asc;
end;
$$;

revoke all on function public.admin_get_room_members(uuid) from public, anon;
grant execute on function public.admin_get_room_members(uuid) to authenticated;
