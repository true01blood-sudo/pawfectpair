-- ============================================================
-- 0021_petguardian.sql
-- Module PetGuardian: GPS tracking & geofencing (zone sigure)
-- Tabele: guardian_zones, guardian_pings, guardian_alerts
-- Securitate: RLS pe toate tabelele (owner-only), check constraints
--             care oglindesc validarea Zod din packages/shared.
-- ============================================================

-- ------------------------------------------------------------
-- ZONE SIGURE (geofence circular per animal)
-- ------------------------------------------------------------
create table public.guardian_zones (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 40),
  center_lat double precision not null check (center_lat between -90 and 90),
  center_lng double precision not null check (center_lng between -180 and 180),
  radius_m integer not null check (radius_m between 50 and 5000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guardian_zones enable row level security;

create policy "Owners manage their pet zones"
  on public.guardian_zones for all
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

-- ------------------------------------------------------------
-- PINGS (istoric poziții GPS)
-- Notă retenție: păstrăm maxim 30 zile — curățare prin job programat
-- (pg_cron) sau funcție apelată periodic; vezi comentariul de la final.
-- ------------------------------------------------------------
create table public.guardian_pings (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  source text not null default 'gps' check (source in ('gps', 'manual', 'simulated')),
  recorded_at timestamptz not null default now()
);

alter table public.guardian_pings enable row level security;

create policy "Owners view their pet pings"
  on public.guardian_pings for select
  using (auth.uid() = (select owner_id from public.pets where id = pet_id));

create policy "Owners record pings for their pets"
  on public.guardian_pings for insert
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

create index idx_guardian_pings_pet_time
  on public.guardian_pings (pet_id, recorded_at desc);

-- ------------------------------------------------------------
-- ALERTE (ieșire/intrare zonă, SOS)
-- Realtime: alertele se propagă live către proprietar.
-- ------------------------------------------------------------
create table public.guardian_alerts (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  zone_id uuid references public.guardian_zones (id) on delete set null,
  type text not null check (type in ('exit_zone', 'enter_zone', 'sos')),
  message text not null default '' check (char_length(message) <= 280),
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.guardian_alerts enable row level security;

create policy "Owners view their pet alerts"
  on public.guardian_alerts for select
  using (auth.uid() = (select owner_id from public.pets where id = pet_id));

create policy "Owners create alerts for their pets"
  on public.guardian_alerts for insert
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

create policy "Owners acknowledge their pet alerts"
  on public.guardian_alerts for update
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

create index idx_guardian_alerts_pet_time
  on public.guardian_alerts (pet_id, created_at desc);

-- Realtime pentru alerte (necesar pentru notificări live)
alter publication supabase_realtime add table public.guardian_alerts;

-- ------------------------------------------------------------
-- RETENȚIE PINGS (opțional, dacă pg_cron e activ pe proiect)
-- Curățare ping-uri mai vechi de 30 de zile:
--   select cron.schedule('guardian-pings-cleanup', '0 3 * * *',
--     $$delete from public.guardian_pings where recorded_at < now() - interval '30 days'$$);
-- Fără pg_cron, rulați manual DELETE-ul ocazional din SQL Editor.
-- ------------------------------------------------------------
