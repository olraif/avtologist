-- Автологист: базовая схема Supabase для MVP.
-- Запуск: Supabase Dashboard -> SQL Editor -> New query -> вставить файл -> Run.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  contact_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Моя машина',
  body text,
  loading text,
  capacity_t numeric not null default 20,
  cost_per_km numeric not null default 55,
  min_margin numeric not null default 25000,
  fill_target numeric not null default 90,
  max_stops integer not null default 2,
  idle_cost_per_hour numeric not null default 2500,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_type text not null,
  exchange_name text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  origin text not null,
  destination text not null,
  title text not null,
  pickup_date date,
  weight_t numeric not null default 10,
  volume_m3 numeric not null default 40,
  body text,
  loading text,
  rate numeric not null default 0,
  distance_km numeric not null default 600,
  detour_km numeric not null default 10,
  reliability numeric not null default 85,
  company text,
  phone text,
  pickup_address text,
  dropoff_address text,
  comment text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  load_id uuid not null references public.loads(id) on delete cascade,
  status text not null default 'Отклик отправлен',
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  response_id uuid not null references public.responses(id) on delete cascade,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.sources enable row level security;
alter table public.loads enable row level security;
alter table public.responses enable row level security;
alter table public.trip_events enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "vehicles_all_own" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sources_all_own" on public.sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "loads_all_own" on public.loads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "responses_all_own" on public.responses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trip_events_all_own" on public.trip_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

