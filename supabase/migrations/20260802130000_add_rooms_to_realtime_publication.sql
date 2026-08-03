-- 방장이 나가서 방이 삭제될 때(leave_room 함수가 rooms 행을 삭제) 잔류 참여자들에게
-- 실시간 DELETE 이벤트를 보내기 위해 rooms 테이블을 supabase_realtime publication에 추가한다.
-- REPLICA IDENTITY는 기본값(PK만 old row에 포함)으로 충분하다 — id=eq.${roomId} 필터 매칭에는
-- 기본키만 있으면 되기 때문에 FULL로 바꿀 필요가 없다.
alter publication supabase_realtime add table public.rooms;
