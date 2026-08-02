create table public.room_bans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid not null references public.profiles(id),
  banned_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.room_bans enable row level security;

create policy "room owner can view bans"
  on public.room_bans for select
  to authenticated
  using (
    exists (
      select 1 from public.rooms r where r.id = room_bans.room_id and r.owner_id = auth.uid()
    )
  );

revoke insert, update, delete on public.room_bans from authenticated;
