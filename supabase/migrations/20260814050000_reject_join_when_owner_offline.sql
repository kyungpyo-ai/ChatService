-- 방장이 이미 이탈한 방에 새 멤버가 입장하는 걸 막는다 (2026-08-14)
--
-- 배경: 방장 혼자 있는 방은 presence로 봐줄 다른 멤버가 없어 cron 백스톱(30초 주기, 45초
-- 임계값, §20260814040000)에만 의존한다. 이 최대 ~75초의 유예 구간 사이에 다른 사용자가
-- join_room()으로 그 방에 들어와버리면, 곧 cron이 방을 삭제할 때 방금 들어온 사용자만
-- 덩그러니 남았다가 갑자기 방이 사라지는 경험을 하게 된다(§사용자 피드백).
--
-- 해결: join_room()이 입장을 완료하기 전에 방장의 하트비트 신선도를 재검증한다. 이미
-- close_abandoned_owner_rooms()가 판단에 쓰는 것과 동일한 45초 임계값을 재사용해, 방장이
-- 스테일 상태면 입장을 막는 동시에 그 자리에서 즉시 방을 정리한다(archive_and_delete_room) —
-- cron의 다음 tick(최대 30초)까지 기다릴 필요 없이 입장 시도 자체가 트리거가 되어 더 빠르다.
-- 잔류 멤버가 있는 방도 동일하게 검증하는데, 정상적으로는 그 멤버들의 presence 기반 즉시
-- 감지(§remove_offline_member)가 이미 방을 정리했을 것이므로 이 경로를 탈 일이 거의 없다 —
-- 그래도 하트비트 재검증은 비용이 거의 없으므로 항상 켜둔다.
create or replace function public.join_room(p_room_id uuid, p_password text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_member_count integer;
  v_owner_heartbeat_room_id uuid;
  v_owner_heartbeat_at timestamptz;
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

  select room_heartbeat_room_id, room_heartbeat_at
    into v_owner_heartbeat_room_id, v_owner_heartbeat_at
  from public.profiles
  where id = v_room.owner_id;

  if coalesce(
    case when v_owner_heartbeat_room_id = p_room_id then v_owner_heartbeat_at else null end,
    v_room.created_at
  ) < now() - interval '45 seconds'
  then
    perform public.archive_and_delete_room(p_room_id);
    raise exception 'room_owner_offline';
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
