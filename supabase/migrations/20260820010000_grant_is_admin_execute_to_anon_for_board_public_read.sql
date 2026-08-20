-- 게시판 목록/상세는 게스트도 볼 수 있어야 하는데, posts/post_comments RLS 정책의
-- `using (not is_deleted or public.is_admin())`이 is_admin()을 참조하면서 anon에게는
-- EXECUTE 권한이 없어(§create_is_admin_function 마이그레이션에서 authenticated에게만
-- grant) 쿼리 플래너가 권한 검사 시점에 permission denied로 막았다 — is_deleted=false라
-- 런타임에는 is_admin() 호출까지 갈 필요가 없는 행에서도, OR 표현식에 포함된 함수 참조
-- 자체는 planning 단계에서 권한이 있어야 한다. is_admin()은 auth.uid()가 null(anon)이면
-- 그냥 false를 반환하도록 이미 안전하게 짜여 있으므로 anon에게 EXECUTE를 열어줘도 무방하다.
grant execute on function public.is_admin() to anon;
