-- 2AM app schema.
-- Run in Supabase SQL editor. Safe to re-run.

create extension if not exists "pgcrypto";

-- profiles
-- Additive-safe: also run these if upgrading an existing deploy.
-- alter table public.profiles add column if not exists months_trying integer;
-- alter table public.profiles add column if not exists baby_name text;
-- alter table public.profiles add column if not exists baby_sex text;
-- alter table public.profiles add column if not exists ai_consent boolean not null default false;
-- Phase 1 re-engagement notification columns are migrated unconditionally in the
-- "Re-engagement notifications" ALTER block just below the create-table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  stage text check (stage in ('pregnant','postpartum','ttc')),
  due_date date,
  week integer,
  baby_age_months integer,
  baby_name text,
  baby_sex text,
  months_trying integer,
  first_pregnancy boolean not null default true,
  concerns text[] not null default '{}',
  tone_preference text not null default 'warm',
  -- one-time consent to Anthropic AI processing, captured before the
  -- user's first message to Myla.
  ai_consent boolean not null default false,
  -- re-engagement notifications state model (Phase 1). Every send is gated on
  -- these by lib/push/state.ts canSend(); see Spec #2.
  notifications_enabled boolean not null default false, -- master switch
  push_paused boolean not null default false,           -- user-initiated pause → support-only
  loss_at timestamptz,                                   -- set on a loss → quiet period, then support-only
  last_distress_at timestamptz,                          -- set when Myla escalates (988/immediate care)
  last_active_at timestamptz,                            -- last chat engagement (inactivity + loss "engaged since")
  timezone text,                                         -- IANA tz for quiet hours (captured at register)
  notify_window_start smallint,                          -- local hour, inclusive (default 9 via app)
  notify_window_end smallint,                            -- local hour, exclusive (default 21 via app)
  push_prompt_state text not null default 'unseen'
    check (push_prompt_state in ('unseen','asked','granted','denied','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Re-engagement notifications state model (Phase 1). The columns above are the
-- source of truth for a fresh DB; these ALTERs migrate an already-existing
-- profiles table. Every statement is `add column if not exists`, so the whole
-- block is safe to re-run and is a no-op on a fresh DB.
alter table public.profiles add column if not exists notifications_enabled boolean not null default false;
alter table public.profiles add column if not exists push_paused boolean not null default false;
alter table public.profiles add column if not exists loss_at timestamptz;
alter table public.profiles add column if not exists last_distress_at timestamptz;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists notify_window_start smallint;
alter table public.profiles add column if not exists notify_window_end smallint;
alter table public.profiles add column if not exists push_prompt_state text not null default 'unseen';

-- push_prompt_state CHECK. Postgres has no ADD CONSTRAINT IF NOT EXISTS, so guard
-- on pg_constraint to stay re-runnable. The name matches what Postgres auto-
-- assigns to the inline column check on a fresh DB, so the guard also no-ops there.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_push_prompt_state_check'
  ) then
    alter table public.profiles
      add constraint profiles_push_prompt_state_check
      check (push_prompt_state in ('unseen','asked','granted','denied','dismissed'));
  end if;
end $$;

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

-- push_devices — one row per device APNs token, tied to the user. Token health
-- (disabled_at) is maintained by the server send path on 410/BadDeviceToken.
create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null default 'ios',
  environment text not null default 'production'
    check (environment in ('sandbox','production')),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,        -- non-null once APNs reported the token dead
  disabled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_devices_user_id_idx
  on public.push_devices (user_id);
-- Fast lookup of a user's live tokens at send time.
create index if not exists push_devices_active_idx
  on public.push_devices (user_id) where disabled_at is null;

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

drop trigger if exists push_devices_set_updated_at on public.push_devices;
create trigger push_devices_set_updated_at
  before update on public.push_devices
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
alter table public.push_devices enable row level security;

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

-- push_devices: a user may see and remove their own devices. Inserts/updates
-- (token upsert, environment self-heal, disabling dead tokens) go through the
-- server's service-role client in /api/push/* — see app/api/push/register.
drop policy if exists "push_devices self read" on public.push_devices;
create policy "push_devices self read" on public.push_devices
  for select using (auth.uid() = user_id);

drop policy if exists "push_devices self delete" on public.push_devices;
create policy "push_devices self delete" on public.push_devices
  for delete using (auth.uid() = user_id);
