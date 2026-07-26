-- profiles 테이블에 나이 컬럼 추가
-- gender와 동일한 이유로 nullable로 두고, setup-profile 플로우(애플리케이션 레벨)에서 필수로 강제한다.
alter table public.profiles
  add column age integer check (age >= 14 and age <= 120);
