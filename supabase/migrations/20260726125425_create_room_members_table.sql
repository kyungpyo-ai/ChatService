create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index room_members_room_id_idx on public.room_members (room_id);

alter table public.room_members enable row level security;

create policy "members can view their room roster"
  on public.room_members for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members me
      where me.room_id = room_members.room_id and me.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.room_members from authenticated;
