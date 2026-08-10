-- Phase 7.5 §7.5.1 — 관리자 판별 함수
--
-- profiles.role = 'admin' 여부를 SECURITY DEFINER로 확인한다. RLS 정책의 using/with check
-- 절에서 이 함수를 호출해도 함수 본문 자체가 RLS를 우회해 직접 테이블을 조회하므로,
-- profiles를 다시 정책 평가로 조회하는 자기 참조 재귀(Phase 3에서 겪은 함정)가 발생하지 않는다.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
