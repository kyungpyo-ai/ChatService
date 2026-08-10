-- Phase 7.5 §7.5.3 — 관리자 조치 감사 로그
--
-- 기록 범위는 "조치만"이다(단순 열람은 기록하지 않음). INSERT는 정책 없음 — 관리자 조치
-- SECURITY DEFINER 함수 내부(§7.5.5)에서만 기록되고 클라이언트가 직접 쓸 수 없다.
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from public, anon, authenticated;

create policy "admins can view audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_admin());
