-- 이용약관/개인정보처리방침 동의 시점을 기록한다(§DEVELOPMENT_PLAN 7.7.1). 최초 프로필 설정
-- (setupProfileAction) 시 now()로 채우며, 나중에 약관이 개정되면 재동의 로직의 기준점으로
-- 재사용할 수 있다.
alter table public.profiles
  add column terms_accepted_at timestamptz;
