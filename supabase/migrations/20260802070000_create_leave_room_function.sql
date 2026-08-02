-- 사용자가 스스로 방을 나가는 기능. room_members에 대한 DELETE는 authenticated에게 revoke되어 있으므로
-- join_room()과 동일하게 SECURITY DEFINER 함수로만 허용한다.
-- 방장이 나가면 소유권 이전 기능이 아직 없으므로 방 자체를 삭제한다(room_members/messages는 on delete cascade로 함께 정리됨).
create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.rooms where id = p_room_id;

  if v_owner_id is null then
    raise exception 'room_not_found';
  end if;

  if v_owner_id = auth.uid() then
    delete from public.rooms where id = p_room_id;
  else
    delete from public.room_members where room_id = p_room_id and user_id = auth.uid();
  end if;
end;
$$;

revoke execute on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;
