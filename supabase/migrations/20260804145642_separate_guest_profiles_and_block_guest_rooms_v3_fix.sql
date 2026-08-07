-- 익명(게스트) 신원을 profiles에서 분리 (2/2) — guest_profiles 테이블 신설, 랜덤채팅 관련
-- 테이블(messages.sender_id, random_queue.user_id, random_sessions.user_a_id/user_b_id/
-- ended_by)의 FK를 profiles(id)에서 공통 조상인 auth.users(id)로 변경해 실가입 회원과 게스트가
-- 함께 참여할 수 있게 하고, handle_new_user() 트리거가 is_anonymous 여부로 profiles/
-- guest_profiles 중 어디에 기록할지 분기하도록 갱신한다.
-- 방채팅 관련 테이블(rooms/room_members/room_bans)은 이제 게스트가 접근 못 하므로(v2 마이그레이션)
-- profiles(id) FK를 그대로 둔다.

create table public.guest_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.guest_profiles enable row level security;

create policy "guests can view own row"
  on public.guest_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "guests can update own row"
  on public.guest_profiles for update
  to authenticated
  using (auth.uid() = id);

revoke insert, delete on public.guest_profiles from authenticated;

alter table public.messages
  drop constraint messages_sender_id_fkey,
  add constraint messages_sender_id_fkey
    foreign key (sender_id) references auth.users(id);

alter table public.random_queue
  drop constraint random_queue_user_id_fkey,
  add constraint random_queue_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.random_sessions
  drop constraint random_sessions_user_a_id_fkey,
  add constraint random_sessions_user_a_id_fkey
    foreign key (user_a_id) references auth.users(id) on delete cascade;

alter table public.random_sessions
  drop constraint random_sessions_user_b_id_fkey,
  add constraint random_sessions_user_b_id_fkey
    foreign key (user_b_id) references auth.users(id) on delete cascade;

alter table public.random_sessions
  drop constraint random_sessions_ended_by_fkey,
  add constraint random_sessions_ended_by_fkey
    foreign key (ended_by) references auth.users(id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) then
    insert into public.guest_profiles (id) values (new.id);
  else
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  end if;
  return new;
end;
$$;
