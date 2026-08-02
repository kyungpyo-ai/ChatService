create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 50),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  max_members smallint not null check (max_members between 2 and 50),
  is_private boolean not null default false,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint password_hash_required_if_private
    check (is_private = false or password_hash is not null)
);

create index rooms_created_at_idx on public.rooms (created_at desc);

alter table public.rooms enable row level security;

create policy "rooms are viewable by everyone"
  on public.rooms for select
  to anon, authenticated
  using (true);

create policy "authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.is_anonymous
    )
  );

revoke select (password_hash) on public.rooms from anon, authenticated;
