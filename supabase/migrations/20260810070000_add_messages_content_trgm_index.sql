-- Phase 7.5 §7.5.6 — 메시지 내용 검색용 부분 GIN trgm 인덱스
--
-- content_type = 'text'인 행만 대상으로 하는 부분 인덱스 — 이미지 메시지는 content가 Storage
-- 경로 문자열이라 검색 대상이 아니다. pg_trgm 확장은 Phase 3에서 이미 활성화됨
-- (profiles_username_trgm_idx와 동일 패턴, §DEVELOPMENT_PLAN 4.4.2).
create index messages_content_trgm_idx
  on public.messages using gin (content gin_trgm_ops)
  where content_type = 'text';
