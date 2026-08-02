-- Realtime의 postgres_changes 채널 구독 시 인증 토큰이 완전히 적용되기 전 잠깐 anon 권한으로
-- 인가 체크를 시도하는데, anon에게 SELECT 테이블 grant 자체가 없으면(이전 마이그레이션에서 revoke)
-- RLS로 인한 빈 결과가 아니라 "permission denied" 하드 에러가 발생해 채널 구독 전체가 실패했다.
-- messages/rooms 테이블처럼 grant는 열어두고 RLS(authenticated 전용, using(true) 없음)로만 막는
-- 원래 패턴으로 되돌린다 — anon이 실제로 읽을 수 있는 행은 여전히 0건이다.
grant select on public.room_members to anon;
