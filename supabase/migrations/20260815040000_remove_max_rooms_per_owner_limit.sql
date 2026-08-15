-- "1인 최대 3개 방" 제약 제거 (2026-08-15)
--
-- §20260814080000에서 "1인 1방" 대신 도입한 제약이었으나, 실사용 피드백에 따라 방 생성
-- 개수 제한 자체를 없애기로 했다. rate limit(메시지/이미지 전송)과는 별개의 메커니즘이다
-- — enforce_max_rooms_per_owner()는 BEFORE INSERT 트리거로 개수만 세는 방식이었다.

drop trigger if exists enforce_max_rooms_per_owner on public.rooms;
drop function if exists public.enforce_max_rooms_per_owner();
