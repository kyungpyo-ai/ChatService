-- Phase 11 — 쪽지(DM) 1차 설계(대화형 스레드) 롤백
--
-- 실제로 원한 기능은 채팅 스레드가 아니라 단발성 쪽지함이라는 게 확인되어, 20260817000000/
-- 20260817010000에서 만든 dm_conversations 테이블과 messages 3-way 확장을 전부 되돌린다.
-- 새 설계(dm_notes 테이블)는 별도 마이그레이션에서 다룬다.

drop trigger if exists on_dm_message_created on public.messages;
drop function if exists public.touch_dm_conversation_last_message();
drop function if exists public.start_or_get_dm_conversation(uuid);

drop policy if exists "dm participants can view dm messages" on public.messages;
drop policy if exists "dm participants can send dm messages" on public.messages;

drop index if exists public.messages_dm_conversation_id_created_at_idx;

alter table public.messages drop constraint if exists exactly_one_context;

alter table public.messages drop column if exists dm_conversation_id;

alter table public.messages add constraint exactly_one_context check (
  (room_id is not null and session_id is null)
  or (room_id is null and session_id is not null)
);

drop table if exists public.dm_conversations;
