-- 랜덤채팅 대기열(random_queue)과 1:1 세션(random_sessions) 테이블 (Phase 5, DB_SCHEMA.md §6)
-- 쓰기는 전부 match_or_wait()/cancel_random_queue()/end_random_session() SECURITY DEFINER
-- 함수로만 수행하므로, authenticated(익명 세션 포함)에게는 SELECT만 허용하고 INSERT/UPDATE/DELETE는 REVOKE한다.

create table public.random_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  queued_at timestamptz not null default now()
);

alter table public.random_queue enable row level security;

create policy "users can view own queue row"
  on public.random_queue for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.random_queue from authenticated;

create table public.random_sessions (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references public.profiles(id),
  check (user_a_id <> user_b_id)
);

create index random_sessions_participants_idx on public.random_sessions (user_a_id, user_b_id);

alter table public.random_sessions enable row level security;

create policy "participants can view their session"
  on public.random_sessions for select
  to authenticated
  using (auth.uid() in (user_a_id, user_b_id));

revoke insert, update, delete on public.random_sessions from authenticated;
