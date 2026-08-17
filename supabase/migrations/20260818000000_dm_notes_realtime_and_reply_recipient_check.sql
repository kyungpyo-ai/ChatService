-- Phase 11 후속 개선 (2026-08-17) — 안읽음 배지 실시간 갱신 + 답장 대상 검증 강화
--
-- 1. dm_notes를 supabase_realtime publication에 등록한다. 이 프로젝트는 messages/rooms/
--    room_members/room_bans 모두 겪었던 함정과 동일하게, publication에 등록하지 않으면
--    RLS/grant를 아무리 맞춰도 postgres_changes 구독 자체가 서버에 등록되지 않는다
--    (§docs/ROADMAP.md Phase 4 "참여자 실시간 반영 버그 3건" 참고).
alter publication supabase_realtime add table public.dm_notes;

-- 2. send_dm_note()의 reply_to_id 검증을 "참여자면 누구나 허용"에서 "원본 쪽지의 수신자
--    본인만 답장 가능"으로 강화한다. 답장은 "받은 쪽지에 대한 응답"이어야 의미가 있는데,
--    기존 검증(v_uid in (sender_id, recipient_id))은 발신자 본인이 자기가 보낸 쪽지를
--    reply_to로 넘겨도 통과시켰다 — 클라이언트 UI만 막고 서버가 안 막으면 우회 가능한 구멍.
create or replace function public.send_dm_note(
  p_recipient_id uuid,
  p_content text,
  p_reply_to_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_content text := trim(p_content);
  v_note_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if v_uid = p_recipient_id then
    raise exception 'cannot_send_to_self';
  end if;

  if v_content = '' then
    raise exception 'empty_content';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'guest_cannot_send_dm';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_recipient_id) then
    raise exception 'recipient_not_found';
  end if;

  if public.is_user_suspended(v_uid) then
    raise exception 'user_suspended';
  end if;

  -- 답장은 "내가 받은 쪽지"에 대해서만 가능하다 — 원본의 수신자가 호출자 본인이어야 한다.
  if p_reply_to_id is not null and not exists (
    select 1 from public.dm_notes n
    where n.id = p_reply_to_id and n.recipient_id = v_uid
  ) then
    raise exception 'reply_target_not_found';
  end if;

  insert into public.dm_notes (sender_id, recipient_id, content, reply_to_id)
  values (v_uid, p_recipient_id, v_content, p_reply_to_id)
  returning id into v_note_id;

  return v_note_id;
end;
$$;

revoke all on function public.send_dm_note(uuid, text, uuid) from public, anon;
grant execute on function public.send_dm_note(uuid, text, uuid) to authenticated;
