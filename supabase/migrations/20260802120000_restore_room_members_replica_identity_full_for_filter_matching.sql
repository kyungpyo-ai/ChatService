-- REPLICA IDENTITY DEFAULT로는 DELETE의 old row에 기본키(id)만 담겨 room_id가 없어서,
-- Realtime 서버가 filter(room_id=eq.X) 매칭 자체를 못 해 DELETE 이벤트가 조용히 드롭됐다.
-- (클라이언트로 오는 payload.old는 어차피 id만 오지만, 서버 내부 필터 평가를 위해 FULL이 필요하다.)
alter table public.room_members replica identity full;
