create or replace function public.handle_new_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_room_created
  after insert on public.rooms
  for each row execute function public.handle_new_room();

-- 트리거 전용 함수라 외부에서 RPC로 직접 호출될 필요가 없다
revoke execute on function public.handle_new_room() from public, anon, authenticated;
