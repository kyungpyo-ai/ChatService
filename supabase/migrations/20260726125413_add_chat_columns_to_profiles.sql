alter table public.profiles
  add column is_anonymous boolean not null default false,
  add column last_seen_at timestamptz not null default now();

create extension if not exists pg_trgm with schema extensions;

create index profiles_username_trgm_idx
  on public.profiles using gin (username extensions.gin_trgm_ops);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, is_anonymous)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.is_anonymous, false)
  );
  return new;
end;
$$;
