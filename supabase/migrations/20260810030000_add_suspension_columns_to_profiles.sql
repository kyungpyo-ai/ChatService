-- Phase 7.5 §7.5.2 (6) — 계정 정지 컬럼
--
-- 정지 여부는 `suspended_at is not null and (suspended_until is null or suspended_until > now())`로
-- 판단한다(§7.5 아래 is_user_suspended(), migration 20260810060000 참고). 정지 이력은 남기고
-- 해제 시 suspended_until = now()로 갱신한다(행 삭제하지 않음).
--
-- 실행 순서 변경 메모(2026-08-09, 구현 중 발견): DEVELOPMENT_PLAN.md §7.5.2 원안은 이 마이그레이션을
-- admin_read_functions/admin_action_functions보다 뒤(#6)에 배치했지만, admin_search_users()/
-- admin_suspend_user() 등이 이 컬럼을 참조하므로 그보다 먼저 적용해야 한다. 파일명은 계획과
-- 동일하게 유지하고 타임스탬프 순서만 앞당겼다 — 상세는 DEVELOPMENT_PLAN.md §7.5 구현 후기 참고.
alter table public.profiles
  add column suspended_at timestamptz,
  add column suspended_until timestamptz,
  add column suspended_reason text;
