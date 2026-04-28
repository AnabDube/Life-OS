-- ─────────────────────────────────────────────────────────────────────────────
-- Life OS — full Supabase schema
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- Re-runs are safe: every CREATE uses IF NOT EXISTS and every POLICY is dropped first.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── Auth & Profile ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  name                text,
  timezone            text default 'UTC',
  avatar_url          text,
  daily_reminder_time text,                          -- 'HH:mm'
  morning_start_time  text default '06:00',         -- 'HH:mm'
  evening_start_time  text default '18:00',         -- 'HH:mm'
  created_at          timestamptz not null default now()
);

-- ── Daily OS ────────────────────────────────────────────────────────────────
create table if not exists public.daily_entries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  date               date not null,
  morning_intention  text,
  evening_reflection text,
  mood               smallint check (mood between 1 and 5),
  energy             smallint check (energy between 1 and 5),
  day_rating         smallint check (day_rating between 1 and 5),
  gratitude          text,
  created_at         timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists daily_entries_user_date_idx on public.daily_entries (user_id, date desc);
-- For installs that ran an earlier version of this file:
alter table public.daily_entries add column if not exists day_rating smallint;
do $$ begin
  alter table public.daily_entries add constraint daily_entries_day_rating_check check (day_rating between 1 and 5);
exception when duplicate_object then null;
end $$;

create table if not exists public.time_blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  date       date not null,
  start_time text not null,                         -- 'HH:mm'
  end_time   text not null,                         -- 'HH:mm'
  label      text not null,
  category   text not null check (category in ('deen','work','trading','personal')),
  color      text,
  completed  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists time_blocks_user_date_idx on public.time_blocks (user_id, date);

-- ── Habits ──────────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  detail      text not null default '',
  category    text not null check (category in ('dhikr','quran','ibadah','fasting','general')),
  active_days smallint[] null,                      -- null = every day; e.g. {1,4} = Mon+Thu
  is_default  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists habits_user_idx on public.habits (user_id, sort_order);

create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  habit_id   uuid not null references public.habits on delete cascade,
  date       date not null,
  done       boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, date desc);

create table if not exists public.reflections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  date            date not null,
  type            text not null default 'daily' check (type in ('daily','weekly')),
  content         text not null,
  habits_summary  jsonb,
  created_at      timestamptz not null default now(),
  unique (user_id, date, type)
);
create index if not exists reflections_user_date_idx on public.reflections (user_id, date desc);

-- ── Work & Classes ──────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  title        text not null,
  notes        text,
  category     text not null check (category in ('work','class','personal')),
  priority     text not null default 'medium' check (priority in ('low','medium','high')),
  due_date     date,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_date);

create table if not exists public.classes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  platform       text,
  schedule_days  smallint[] null,                   -- 0..6, Sun..Sat
  schedule_time  text,                              -- 'HH:mm'
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.class_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  class_id   uuid not null references public.classes on delete cascade,
  date       date not null,
  attended   boolean not null default false,
  notes      text,
  created_at timestamptz not null default now(),
  unique (class_id, date)
);
create index if not exists class_sessions_user_date_idx on public.class_sessions (user_id, date desc);

-- ── Trading Journal ─────────────────────────────────────────────────────────
create table if not exists public.trades (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  date             date not null,
  pair             text not null,
  direction        text not null check (direction in ('buy','sell')),
  entry_price      numeric(18,6) not null,
  exit_price       numeric(18,6),
  lot_size         numeric(10,2) not null,
  stop_loss        numeric(18,6),
  take_profit      numeric(18,6),
  pips             numeric(10,2),
  profit_loss      numeric(14,2),
  session          text check (session in ('london','new_york','asian','overlap')),
  confluences      text[] not null default '{}',
  emotions_before  text[] not null default '{}',
  emotions_after   text[] not null default '{}',
  outcome          text check (outcome in ('win','loss','breakeven')),
  screenshot_url   text,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists trades_user_date_idx on public.trades (user_id, date desc);

create table if not exists public.trading_rules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  rule       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.trade_rule_checks (
  trade_id  uuid not null references public.trades        on delete cascade,
  rule_id   uuid not null references public.trading_rules on delete cascade,
  followed  boolean not null default false,
  primary key (trade_id, rule_id)
);

-- ── Finances ────────────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  type       text not null check (type in ('bank','trading','savings','mobile_money')),
  currency   text not null default 'USD',
  balance    numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  account_id  uuid not null references public.accounts on delete cascade,
  amount      numeric(14,2) not null,
  type        text not null check (type in ('income','expense','transfer')),
  category    text not null,
  description text,
  date        date not null,
  created_at  timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

create table if not exists public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  category      text not null,
  monthly_limit numeric(14,2) not null,
  month         text not null,                      -- 'YYYY-MM'
  created_at    timestamptz not null default now(),
  unique (user_id, category, month)
);

create table if not exists public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  target_amount  numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline       date,
  created_at     timestamptz not null default now()
);

-- ── Auto-create profile row on signup ───────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.daily_entries     enable row level security;
alter table public.time_blocks       enable row level security;
alter table public.habits            enable row level security;
alter table public.habit_logs        enable row level security;
alter table public.reflections       enable row level security;
alter table public.tasks             enable row level security;
alter table public.classes           enable row level security;
alter table public.class_sessions    enable row level security;
alter table public.trades            enable row level security;
alter table public.trading_rules     enable row level security;
alter table public.trade_rule_checks enable row level security;
alter table public.accounts          enable row level security;
alter table public.transactions      enable row level security;
alter table public.budgets           enable row level security;
alter table public.savings_goals     enable row level security;

-- profiles
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- helper macro pattern: each user-scoped table gets full CRUD on auth.uid() = user_id.
-- daily_entries
drop policy if exists "daily_entries: rw own" on public.daily_entries;
create policy "daily_entries: rw own" on public.daily_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- time_blocks
drop policy if exists "time_blocks: rw own" on public.time_blocks;
create policy "time_blocks: rw own" on public.time_blocks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habits
drop policy if exists "habits: rw own" on public.habits;
create policy "habits: rw own" on public.habits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habit_logs
drop policy if exists "habit_logs: rw own" on public.habit_logs;
create policy "habit_logs: rw own" on public.habit_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reflections
drop policy if exists "reflections: rw own" on public.reflections;
create policy "reflections: rw own" on public.reflections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
drop policy if exists "tasks: rw own" on public.tasks;
create policy "tasks: rw own" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- classes
drop policy if exists "classes: rw own" on public.classes;
create policy "classes: rw own" on public.classes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- class_sessions
drop policy if exists "class_sessions: rw own" on public.class_sessions;
create policy "class_sessions: rw own" on public.class_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trades
drop policy if exists "trades: rw own" on public.trades;
create policy "trades: rw own" on public.trades for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trading_rules
drop policy if exists "trading_rules: rw own" on public.trading_rules;
create policy "trading_rules: rw own" on public.trading_rules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trade_rule_checks: gated through the parent trade's user_id
drop policy if exists "trade_rule_checks: rw own" on public.trade_rule_checks;
create policy "trade_rule_checks: rw own" on public.trade_rule_checks for all
  using (
    exists (select 1 from public.trades t where t.id = trade_rule_checks.trade_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trades t where t.id = trade_rule_checks.trade_id and t.user_id = auth.uid())
  );

-- accounts
drop policy if exists "accounts: rw own" on public.accounts;
create policy "accounts: rw own" on public.accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions
drop policy if exists "transactions: rw own" on public.transactions;
create policy "transactions: rw own" on public.transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- budgets
drop policy if exists "budgets: rw own" on public.budgets;
create policy "budgets: rw own" on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- savings_goals
drop policy if exists "savings_goals: rw own" on public.savings_goals;
create policy "savings_goals: rw own" on public.savings_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
