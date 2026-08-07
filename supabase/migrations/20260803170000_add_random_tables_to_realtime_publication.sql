-- Phase 3~4에서 반복 발견된 "publication 미등록으로 postgres_changes 구독 자체가 안 되는" 함정을
-- 이번엔 착수 전에 반영한다. random_sessions의 INSERT(매칭 성사 알림)/UPDATE(세션 종료 알림)를
-- 클라이언트가 구독해야 하므로 supabase_realtime publication에 등록한다.
-- random_queue는 클라이언트가 직접 구독하지 않으므로(매칭 감지는 random_sessions INSERT로 처리)
-- 등록하지 않는다. messages는 Phase 3에서 이미 등록되어 있어 세션 메시지 구독에도 그대로 적용된다.
alter publication supabase_realtime add table public.random_sessions;
