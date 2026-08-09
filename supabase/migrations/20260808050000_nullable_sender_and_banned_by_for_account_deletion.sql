-- Phase 7 (1.5): 계정 탈퇴가 FK 위반으로 막히는 문제 수정 (2026-08-08)
--
-- 배경: 트리거 기반 아카이브를 붙이고 실제로 SQL에서 계정 삭제를 재현해보니, 삭제 자체가
-- 아카이브를 건너뛰는 수준이 아니라 통째로 실패했다.
--
--   messages.sender_id references auth.users(id)   -- ON DELETE NO ACTION
--   room_bans.banned_by references profiles(id)    -- ON DELETE NO ACTION
--
-- 방장이 아닌 방/세션에서 보낸 메시지, 과거에 누군가를 강퇴한 이력은 rooms/random_sessions
-- cascade 경로에 포함되지 않으므로(그 방/세션 자체는 남의 소유라 안 지워짐) 그대로 남아
-- 있고, 이 FK가 NO ACTION이라 auth.users DELETE 시점에 위반 에러가 난다.
--
-- CASCADE로 바꾸는 대신 SET NULL을 택한다 — CASCADE면 탈퇴한 사람이 다른 사람 방/세션에
-- 남긴 메시지까지 통째로 사라져 남아있는 상대방의 대화 기록에 구멍이 생긴다. 이번 Phase가
-- 트리거로 보장하려는 "삭제 경로와 무관하게 대화 기록을 보존한다"는 목적과 정면으로
-- 배치된다. SET NULL은 메시지/강퇴 기록 자체는 남기고 "누가 보냈는지"만 잃는다 — 화면에는
-- "탈퇴한 사용자"로 표시한다(app/queries·컴포넌트에서 처리).

alter table public.messages alter column sender_id drop not null;

alter table public.messages drop constraint messages_sender_id_fkey;
alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id) references auth.users(id) on delete set null;

alter table public.room_bans alter column banned_by drop not null;

alter table public.room_bans drop constraint room_bans_banned_by_fkey;
alter table public.room_bans
  add constraint room_bans_banned_by_fkey
  foreign key (banned_by) references public.profiles(id) on delete set null;
