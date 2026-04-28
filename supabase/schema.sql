-- ─────────────────────────────────────────────────────────────────────────────
-- Spiritual Habits — Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Re-runs are safe: every CREATE uses IF NOT EXISTS, every POLICY is dropped first.
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles ────────────────────────────────────────────────────────────────────
-- One row per auth user. Created automatically by the trigger below.
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  email         text,
  display_name  text,
  reminder_time text,                              -- "HH:mm" or null (Step 9)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- user_habits ─────────────────────────────────────────────────────────────────
-- Custom habits added by users via the AddHabitModal (Step 6).
create table if not exists public.user_habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  detail       text not null default '',
  tag          text not null check (tag in ('dhikr','quran','ibadah','fast','other')),
  tag_label    text not null,
  active_on    smallint[] null,                    -- e.g. {1,4} for Mon+Thu; null = every day
  created_at   timestamptz not null default now()
);
create index if not exists user_habits_user_idx on public.user_habits (user_id);

-- habit_logs ──────────────────────────────────────────────────────────────────
-- One row per (user, habit, day) when the habit is marked done.
-- habit_id is text so it can hold both built-in slugs ("la-ilaha") and uuids.
create table if not exists public.habit_logs (
  user_id    uuid not null references auth.users on delete cascade,
  habit_id   text not null,
  date       date not null,
  done       boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, date desc);

-- daily_reflections ───────────────────────────────────────────────────────────
-- Cache for the AI-generated daily reflection (Step 7) — one per user per day.
create table if not exists public.daily_reflections (
  user_id    uuid not null references auth.users on delete cascade,
  date       date not null,
  text       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Auto-create profile row on signup ───────────────────────────────────────────
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

-- Row Level Security ──────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.user_habits       enable row level security;
alter table public.habit_logs        enable row level security;
alter table public.daily_reflections enable row level security;

-- profiles
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- user_habits
drop policy if exists "user_habits: read own"   on public.user_habits;
drop policy if exists "user_habits: insert own" on public.user_habits;
drop policy if exists "user_habits: update own" on public.user_habits;
drop policy if exists "user_habits: delete own" on public.user_habits;
create policy "user_habits: read own"   on public.user_habits for select using (auth.uid() = user_id);
create policy "user_habits: insert own" on public.user_habits for insert with check (auth.uid() = user_id);
create policy "user_habits: update own" on public.user_habits for update using (auth.uid() = user_id);
create policy "user_habits: delete own" on public.user_habits for delete using (auth.uid() = user_id);

-- habit_logs
drop policy if exists "habit_logs: read own"   on public.habit_logs;
drop policy if exists "habit_logs: insert own" on public.habit_logs;
drop policy if exists "habit_logs: update own" on public.habit_logs;
drop policy if exists "habit_logs: delete own" on public.habit_logs;
create policy "habit_logs: read own"   on public.habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs: insert own" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs: update own" on public.habit_logs for update using (auth.uid() = user_id);
create policy "habit_logs: delete own" on public.habit_logs for delete using (auth.uid() = user_id);

-- daily_reflections
drop policy if exists "reflections: read own"   on public.daily_reflections;
drop policy if exists "reflections: insert own" on public.daily_reflections;
create policy "reflections: read own"   on public.daily_reflections for select using (auth.uid() = user_id);
create policy "reflections: insert own" on public.daily_reflections for insert with check (auth.uid() = user_id);
