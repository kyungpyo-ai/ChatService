-- 방채팅 이전 대화 노출 범위를 "입장 시점 이후"로 제한 (2026-08-08)
--
-- 배경: 기존 SELECT 정책은 "이 방의 멤버인가"만 확인하고 입장 시점을 비교하지 않아,
-- 새로 입장한 사람이 그 방의 과거 대화를 전부 볼 수 있었다. 이 서비스의 공개방은 목록에
-- 노출되고 로그인만 하면 누구나 자유롭게 입장할 수 있으므로, 아무나 들어와 과거 대화를
-- 읽고 나가는 것이 가능한 상태였다. 카카오톡 오픈채팅과 동일하게 입장 이후 메시지만
-- 보이도록 바꾼다.
--
-- ⚠️ Phase 3에서 room_members 정책이 자기 자신을 서브쿼리해 infinite recursion이 터진
-- 전례가 있어(20260802060000), 여기서도 room_members를 정책 안에서 직접 서브쿼리하지 않고
-- SECURITY DEFINER 함수로 감싼다.
--
-- 비멤버는 함수가 null을 반환하고 `created_at >= null`이 null(=거짓)로 평가되므로,
-- 멤버십 확인과 시점 컷오프가 이 조건 하나로 동시에 처리된다.

create or replace function public.room_member_joined_at(p_room_id uuid)
returns timestamptz
language sql
security definer
set search_path = ''
stable
as $$
  select rm.joined_at
  from public.room_members rm
  where rm.room_id = p_room_id
    and rm.user_id = (select auth.uid())
$$;

comment on function public.room_member_joined_at(uuid) is
  '호출자가 해당 방에 입장한 시각. 멤버가 아니면 null. messages SELECT 정책에서 이전 대화 컷오프에 사용.';

revoke all on function public.room_member_joined_at(uuid) from public, anon;
grant execute on function public.room_member_joined_at(uuid) to authenticated;

drop policy if exists "room participants can view room messages" on public.messages;

create policy "room participants can view room messages"
  on public.messages for select
  to authenticated
  using (
    room_id is not null
    and created_at >= public.room_member_joined_at(room_id)
  );
