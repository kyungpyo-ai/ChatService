-- extensions.crypt()로 검증 가능하도록 password_hash는 애플리케이션에서 bcrypt(bcryptjs)로 해시해 저장한다.
create or replace function public.join_room(p_room_id uuid, p_password text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_member_count integer;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    raise exception 'room_not_found';
  end if;

  if exists (
    select 1 from public.room_bans b
    where b.room_id = p_room_id and b.user_id = auth.uid()
  ) then
    raise exception 'banned_from_room';
  end if;

  if exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) then
    return;
  end if;

  if v_room.is_private then
    if p_password is null or not (extensions.crypt(p_password, v_room.password_hash) = v_room.password_hash) then
      raise exception 'invalid_password';
    end if;
  end if;

  select count(*) into v_member_count from public.room_members where room_id = p_room_id;

  if v_member_count >= v_room.max_members then
    raise exception 'room_full';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (p_room_id, auth.uid(), 'member');
end;
$$;

revoke execute on function public.join_room(uuid, text) from public, anon;
grant execute on function public.join_room(uuid, text) to authenticated;
