-- 게스트 화면의 방 목록에서 참여자 수(n/max)가 항상 0으로 보이던 문제 수정.
-- room_members SELECT 정책이 authenticated로만 제한되어 있어 anon은 count(*) 집계 자체가 0으로 나왔음.
-- (컬럼 단위 grant만으로는 PostgREST의 count(*) 집계가 동작하지 않아 명단 전체를 열어야 했던 시도는 폐기)
-- 참여자 수(count)만 공개하고, 실제 명단(user_id/role 등)은 여전히 authenticated에게만 공개되도록
-- SECURITY DEFINER computed-column 함수로 count(*)만 안전하게 노출한다.
create or replace function public.room_member_count(r public.rooms)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.room_members where room_id = r.id;
$$;

revoke execute on function public.room_member_count(public.rooms) from public;
grant execute on function public.room_member_count(public.rooms) to anon, authenticated;
