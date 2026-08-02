-- session_id는 random_sessions 테이블이 아직 없어(Phase 5) FK 없이 uuid로만 생성한다.
-- Phase 5에서 random_sessions 테이블 생성 시 FK 제약과 세션 참여자 RLS 정책을 추가한다.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  session_id uuid,
  sender_id uuid not null references public.profiles(id),
  content_type text not null check (content_type in ('text', 'image')),
  content text not null,
  created_at timestamptz not null default now(),
  constraint exactly_one_context check (
    (room_id is not null and session_id is null)
    or (room_id is null and session_id is not null)
  )
);

create index messages_room_id_created_at_idx on public.messages (room_id, created_at);
create index messages_session_id_created_at_idx on public.messages (session_id, created_at);

alter table public.messages enable row level security;

create policy "room participants can view room messages"
  on public.messages for select
  to authenticated
  using (
    room_id is not null and exists (
      select 1 from public.room_members rm
      where rm.room_id = messages.room_id and rm.user_id = auth.uid()
    )
  );

create policy "room participants can send room messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and room_id is not null
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = messages.room_id and rm.user_id = auth.uid()
    )
  );
