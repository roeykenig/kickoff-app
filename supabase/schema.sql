create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create table if not exists public.profiles (
  id text primary key,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text unique,
  name text not null,
  initials text not null,
  avatar_color text not null,
  rating numeric(3, 1) not null default 5.0,
  games_played integer not null default 0,
  position text,
  bio text,
  photo_url text,
  rating_history jsonb not null default '[]'::jsonb,
  lobby_history jsonb not null default '[]'::jsonb,
  is_mock boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lobbies (
  id text primary key,
  title text not null,
  field_name text not null,
  address text not null,
  city text not null,
  datetime timestamptz not null,
  max_players integer not null,
  num_teams integer,
  players_per_team integer,
  min_rating numeric(3, 1),
  is_private boolean not null default false,
  price integer,
  description text,
  created_by text not null references public.profiles (id) on delete restrict,
  distance_km numeric(5, 1) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lobby_memberships (
  lobby_id text not null references public.lobbies (id) on delete cascade,
  profile_id text not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('joined', 'waitlisted', 'pending_confirm', 'left')),
  created_at timestamptz not null default now(),
  primary key (lobby_id, profile_id)
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_profile_id text not null references public.profiles (id) on delete cascade,
  to_profile_id text not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (from_profile_id, to_profile_id),
  check (from_profile_id <> to_profile_id)
);

alter table public.profiles enable row level security;
alter table public.lobbies enable row level security;
alter table public.lobby_memberships enable row level security;
alter table public.friend_requests enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
on public.profiles
for select
using (true);

drop policy if exists "lobbies are readable by everyone" on public.lobbies;
create policy "lobbies are readable by everyone"
on public.lobbies
for select
using (true);

drop policy if exists "memberships are readable by everyone" on public.lobby_memberships;
create policy "memberships are readable by everyone"
on public.lobby_memberships
for select
using (true);

drop policy if exists "friend requests readable by involved users" on public.friend_requests;
create policy "friend requests readable by involved users"
on public.friend_requests
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id in (from_profile_id, to_profile_id)
  )
);

drop policy if exists "authenticated users can insert their own profile" on public.profiles;
create policy "authenticated users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "authenticated users can create lobbies they own" on public.lobbies;
create policy "authenticated users can create lobbies they own"
on public.lobbies
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = created_by
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated users can update their own lobbies" on public.lobbies;
create policy "authenticated users can update their own lobbies"
on public.lobbies
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = created_by
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = created_by
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated users can manage their memberships" on public.lobby_memberships;
create policy "authenticated users can manage their memberships"
on public.lobby_memberships
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated users can send friend requests" on public.friend_requests;
create policy "authenticated users can send friend requests"
on public.friend_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = from_profile_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "involved users can update friend requests" on public.friend_requests;
create policy "involved users can update friend requests"
on public.friend_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id in (from_profile_id, to_profile_id)
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id in (from_profile_id, to_profile_id)
  )
);

drop policy if exists "avatar images are publicly readable" on storage.objects;
create policy "avatar images are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "authenticated users can upload their own avatar" on storage.objects;
create policy "authenticated users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "authenticated users can update their own avatar" on storage.objects;
create policy "authenticated users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "authenticated users can delete their own avatar" on storage.objects;
create policy "authenticated users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
