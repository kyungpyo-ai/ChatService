-- touch_dm_conversation_last_message()는 AFTER INSERT 트리거 전용 함수인데, SECURITY DEFINER라
-- 기본적으로 /rest/v1/rpc/touch_dm_conversation_last_message로 anon/authenticated가 직접 호출할
-- 수 있는 상태였다(get_advisors security로 발견). archive_room_before_delete() 등 기존 트리거
-- 전용 함수와 동일하게 EXECUTE 권한을 회수한다 — 트리거 실행 자체는 함수 소유자 권한으로
-- 동작하므로 영향이 없다.
revoke execute on function public.touch_dm_conversation_last_message() from public, anon, authenticated;
