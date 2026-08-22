-- "1인 최대 3개 방" 제약 재도입 (2026-08-22)
--
-- §20260815040000에서 제거했던 제약을 다시 추가한다. 방장 본인이 소유한 방이 이미 3개면
-- 새 방 생성을 막는다.

create or replace function public.enforce_max_rooms_per_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.rooms where owner_id = new.owner_id) >= 3 then
    raise exception 'max_rooms_exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_max_rooms_per_owner on public.rooms;
create trigger enforce_max_rooms_per_owner
  before insert on public.rooms
  for each row execute function public.enforce_max_rooms_per_owner();
