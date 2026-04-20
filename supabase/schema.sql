-- 2AM app schema.
-- Run in Supabase SQL editor. Safe to re-run.

create extension if not exists "pgcrypto";

-- profiles
-- Additive-safe: also run these if upgrading an existing deploy.
-- alter table public.profiles add column if not exists months_trying integer;
-- alter table public.profiles add column if not exists baby_name text;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  stage text check (stage in ('pregnant','postpartum','ttc')),
  due_date date,
  week integer,
  baby_age_months integer,
  baby_name text,
  months_trying integer,
  first_pregnancy boolean not null default true,
  concerns text[] not null default '{}',
  tone_preference text not null default 'warm',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'untitled',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_updated_at_idx
  on public.conversations (user_id, updated_at desc);

-- mood_logs
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mood text not null check (mood in ('great','okay','meh','rough','anxious')),
  created_at timestamptz not null default now()
);

create index if not exists mood_logs_user_id_created_at_idx
  on public.mood_logs (user_id, created_at desc);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.tg_set_updated_at();

-- auto-provision a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.mood_logs enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "conversations self read" on public.conversations;
create policy "conversations self read" on public.conversations
  for select using (auth.uid() = user_id);

drop policy if exists "conversations self write" on public.conversations;
create policy "conversations self write" on public.conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "conversations self update" on public.conversations;
create policy "conversations self update" on public.conversations
  for update using (auth.uid() = user_id);

drop policy if exists "conversations self delete" on public.conversations;
create policy "conversations self delete" on public.conversations
  for delete using (auth.uid() = user_id);

drop policy if exists "mood self read" on public.mood_logs;
create policy "mood self read" on public.mood_logs
  for select using (auth.uid() = user_id);

drop policy if exists "mood self write" on public.mood_logs;
create policy "mood self write" on public.mood_logs
  for insert with check (auth.uid() = user_id);
