-- 방장 오프라인 자동 종료 기능을 원복하고 "1인 1방" 대신 "1인 최대 3방"으로 변경 (2026-08-14)
--
-- 배경: presence/하트비트/cron 기반 자동 종료(§20260814000000~20260814050000)가 실사용
-- QA에서 감지 지연·중복 아카이브·beacon 신뢰성 등 여러 문제를 드러냈고, 최종적으로
-- "브라우저 종료로는 방을 지우지 않고, 방장이 나가기 버튼을 눌렀을 때만 방이 사라진다"는
-- 원래 방식으로 되돌리기로 했다(§leave_room, 이미 있던 로직 그대로 유지). 대신 "1인 1방"
-- 제약은 너무 빡빡하다는 판단에 "1인 최대 3방"으로 완화한다.
--
-- 원복 대상: rooms.owner_id unique 제약, close_abandoned_owner_rooms() + cron,
-- remove_offline_member(), join_room()의 방장 오프라인 재검증. archive_and_delete_room()과
-- leave_room()은 "나가기 버튼으로 방장이 나가면 방 삭제"에 그대로 쓰이므로 손대지 않는다.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'close-abandoned-owner-rooms') then
    perform cron.unschedule('close-abandoned-owner-rooms');
  end if;
end;
$$;

drop function if exists public.close_abandoned_owner_rooms();
drop function if exists public.remove_offline_member(uuid, uuid);

alter table public.rooms drop constraint if exists rooms_owner_id_key;

-- join_room()을 방장 오프라인 재검증 이전 버전(§20260809010000 계열)으로 원복.
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
  if not exists (select 1 from public.profiles p where p.id = auth.uid()) then
    raise exception 'guest_cannot_join_room';
  end if;

  if public.is_user_suspended(auth.uid()) then
    raise exception 'user_suspended';
  end if;

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

-- "1인 최대 3방" — unique 제약 대신 BEFORE INSERT 트리거로 개수만 제한한다. 방장 본인이
-- 소유한 방이 이미 3개면 새 방 생성을 막는다. 정확한 동시성 보장(레이스 방지)까지는 필요
-- 없는 규모라 단순 count 체크로 충분하다.
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
