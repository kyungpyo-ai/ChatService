-- 강퇴당한 본인이 강퇴 사실을 실시간으로 알 수 있게 room_bans SELECT 정책 추가 (2026-08-09)
--
-- 배경: room_members DELETE Realtime 이벤트는 postgres_changes RLS 평가 시점에 이미
-- 그 행(자기 자신의 멤버십)이 지워진 뒤라, room_members의 "같은 방 멤버만 조회 가능"
-- 정책으로는 강퇴당한 본인이 자신의 DELETE 이벤트를 못 받을 가능성이 크다(자기 행이
-- 없어졌으니 "같은 방 멤버"라는 조건 자체가 거짓이 됨). 반면 room_bans은 강퇴 시점에
-- 강퇴당한 본인을 user_id로 하는 새 행이 INSERT되므로, 그 행 자체에 대해 본인이
-- 조회 가능한 정책만 있으면 실시간 INSERT 이벤트로 확실하게 알림을 받을 수 있다.

create policy "banned user can view own ban"
  on public.room_bans for select
  to authenticated
  using (user_id = (select auth.uid()));

-- room_bans도 messages/rooms/room_members처럼 supabase_realtime publication에 등록해야
-- postgres_changes 구독 자체가 가능하다(§Phase 3에서 messages 테이블에 겪은 것과 동일한 함정).
alter publication supabase_realtime add table public.room_bans;
