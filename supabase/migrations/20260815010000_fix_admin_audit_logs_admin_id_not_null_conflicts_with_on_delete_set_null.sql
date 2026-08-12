-- 계정 탈퇴(deleteAccountAction) 시 "계정 탈퇴에 실패했습니다"로 실패하는 문제 수정
-- (§사용자 재현: 과거 관리자 조치를 한 번이라도 수행한 계정이 스스로 탈퇴를 시도하면 실패).
--
-- admin_audit_logs.admin_id가 `not null`이면서 동시에 `references auth.users(id)
-- on delete set null`로 정의되어 있었다(§20260810020000) — 두 제약이 서로 모순된다.
-- 해당 관리자가 admin_id로 남긴 감사 로그가 하나라도 있는 상태에서 auth.users에서
-- 그 계정을 삭제하면, FK가 관련 admin_audit_logs 행의 admin_id를 null로 바꾸려다
-- NOT NULL 제약에 걸려 "ERROR: null value in column "admin_id" ... violates
-- not-null constraint"로 전체 삭제 트랜잭션이 실패한다.
--
-- 감사 로그는 관리자 계정이 나중에 탈퇴하더라도 "조치가 있었다는 사실"은 남기는 것이
-- on delete set null을 선택한 원래 의도이므로, admin_id를 nullable로 바꿔 그 의도대로
-- 동작하게 한다(로그 자체를 지우거나 삭제를 막는 대신).
alter table public.admin_audit_logs
  alter column admin_id drop not null;
