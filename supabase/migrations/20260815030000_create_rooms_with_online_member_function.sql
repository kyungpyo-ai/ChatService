-- 방채팅 목록 온라인 필터링(getRoomList)을 위한 SECURITY DEFINER 함수.
--
-- room_members SELECT 정책("members can view their room roster", §20260802060000)이
-- "그 방의 멤버만 그 방의 room_members 행을 볼 수 있다"로 되어 있어서, 아직 참여하지 않은
-- 방을 둘러보는(browsing) 사용자는 다른 방들의 room_members를 직접 조회할 수 없다.
-- 그 결과 온라인 필터 쿼리가 항상 빈 값을 반환해 모든 방이 목록에서 사라지는 버그가 있었다
-- (§실사용 확인, 2026-08-15) — is_room_member()와 동일한 우회 패턴으로 해결한다.
create function public.rooms_with_online_member(p_room_ids uuid[], p_threshold timestamptz)
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select distinct rm.room_id
  from public.room_members rm
  join public.profiles p on p.id = rm.user_id
  where rm.room_id = any(p_room_ids)
    and p.last_seen_at > p_threshold;
$$;

revoke execute on function public.rooms_with_online_member(uuid[], timestamptz) from public, anon;
grant execute on function public.rooms_with_online_member(uuid[], timestamptz) to authenticated;
