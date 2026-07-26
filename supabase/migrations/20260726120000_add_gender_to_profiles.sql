-- profiles 테이블에 성별 컬럼 추가
-- PRD §4.1 PRO-03: 최초 로그인 시 성별(남성/여성)을 필수로 선택한다.
-- handle_new_user() 트리거 시점에는 아직 값이 없으므로 DB 컬럼 자체는 nullable로 두고,
-- setup-profile 플로우(애플리케이션 레벨)에서 필수로 강제한다.
alter table public.profiles
  add column gender text check (gender in ('male', 'female'));
