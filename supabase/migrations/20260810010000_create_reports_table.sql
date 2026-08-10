-- Phase 7.5 §7.5.3 — 신고 테이블
--
-- 신고자는 자신이 만든 신고만 조회 가능, 관리자는 is_admin()으로 전체 조회.
-- UPDATE 정책은 없음 — admin_resolve_report()/admin_dismiss_report() SECURITY DEFINER
-- 함수(§7.5.5)로만 처리한다.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('room', 'random_session', 'message', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'abuse', 'illegal', 'other')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz not null default now()
);

create index reports_status_created_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
revoke all on public.reports from public, anon;

create policy "reporters can view own reports"
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "authenticated can create reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
