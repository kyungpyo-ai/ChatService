-- 비로그인 방문자에게 방 목록이 항상 비어 보이던 버그 수정 (2026-11-21)
--
-- getRoomList()(lib/queries/rooms.ts)는 "온라인 멤버가 있는 방"만 노출하려고
-- rooms_with_online_member()를 호출하는데, 20260815030000 마이그레이션에서 이 함수 실행 권한을
-- authenticated에만 주고 anon에서는 회수했다. 그 결과 로그인하지 않은 방문자(검색엔진·광고 심사
-- 포함)는 RPC가 권한 오류로 실패해 방 목록이 항상 "아직 개설된 방이 없어요"로 보였다.
-- 랜덤채팅 게스트는 익명 로그인(authenticated)이라 정상으로 보여 지금까지 발견되지 않았다.
--
-- rooms 테이블 자체는 이미 anon SELECT가 허용돼 있고("rooms are viewable by everyone"), 이 함수는
-- 전달받은 room_id 중 온라인 멤버가 있는 room_id만 돌려줄 뿐이라 anon에 열어도 추가로 노출되는
-- 정보는 사실상 없다(멤버 신원·접속 시각은 반환하지 않음).

grant execute on function public.rooms_with_online_member(uuid[], timestamptz) to anon;
