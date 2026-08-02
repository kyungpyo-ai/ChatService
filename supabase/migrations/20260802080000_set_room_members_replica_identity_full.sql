-- room_members의 기본 REPLICA IDENTITY(DEFAULT)는 DELETE 이벤트의 old row에 기본키(id)만 포함시킨다.
-- 클라이언트가 "누가 나갔는지"(user_id)를 알아야 참여자 목록/입장·퇴장 알림을 실시간으로 갱신할 수 있고,
-- room_id 기준 필터(postgres_changes filter)도 old row에 room_id가 있어야 동작하므로 FULL로 변경한다.
alter table public.room_members replica identity full;
