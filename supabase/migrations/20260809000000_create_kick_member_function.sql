-- 방장 강퇴 함수 (2026-08-09)
--
-- DB_SCHEMA.md §8이 Phase 3 설계 때부터 kick_member()를 SECURITY DEFINER 함수 표에
-- 문서화해두었으나, 실제로는 어느 마이그레이션에도 구현된 적이 없었다(Phase 7 착수 중
-- `select proname from pg_proc where proname = 'kick_member'`로 확인 — 0건). 문서와
-- 실제 DB가 어긋나 있던 것으로, join_room()의 room_bans 검사만 먼저 구현되고 강퇴를
-- 발동시키는 함수 자체는 빠져 있었다.
--
-- join_room()과 동일하게 호출자 신원은 auth.uid()로만 판단하고, 방장 여부를 함수
-- 내부에서 재검증한다 — 클라이언트가 넘긴 값은 신뢰하지 않는다.

create or replace function public.kick_member(p_room_id uuid, p_target_user_id uuid)
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

  if v_owner_id <> auth.uid() then
    raise exception 'not_room_owner';
  end if;

  if p_target_user_id = v_owner_id then
    raise exception 'cannot_kick_owner';
  end if;

  delete from public.room_members
  where room_id = p_room_id and user_id = p_target_user_id;

  if not found then
    raise exception 'not_a_member';
  end if;

  insert into public.room_bans (room_id, user_id, banned_by)
  values (p_room_id, p_target_user_id, auth.uid())
  on conflict (room_id, user_id) do nothing;
end;
$$;

comment on function public.kick_member(uuid, uuid) is
  '호출자가 해당 방의 방장인지 재검증 후 대상 사용자를 room_members에서 제거하고 room_bans에 기록한다. 재입장 차단은 join_room()의 기존 room_bans 확인 로직이 담당한다.';

revoke all on function public.kick_member(uuid, uuid) from public, anon;
grant execute on function public.kick_member(uuid, uuid) to authenticated;
