-- ============================================================
-- 0024_petwell.sql — Modul PetWell (aplicația MOBILĂ)
-- medical_records + weight_logs există deja (0010_petwell.sql web;
-- aplicația mobilă le folosește pentru fișa medicală & grafic greutate).
-- Această extensie idempotentă adaugă doar indexuri de performanță.
-- Triajul simptome (motor de reguli) rulează 100% local în aplicație —
-- nu necesită tabele suplimentare.
-- ============================================================

-- 1) Tabele idempotente (pentru medii noi)
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('vaccination', 'treatment', 'surgery', 'checkup', 'allergy', 'other')),
  title text not null,
  record_date date not null default current_date,
  next_due_date date,
  notes text,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  weight_kg numeric not null check (weight_kg > 0),
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 2) RLS idempotent
alter table public.medical_records enable row level security;
alter table public.weight_logs enable row level security;

drop policy if exists "Owners manage their pets' medical records" on public.medical_records;
create policy "Owners manage their pets' medical records"
  on public.medical_records for all
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

drop policy if exists "Owners manage their pets' weight logs" on public.weight_logs;
create policy "Owners manage their pets' weight logs"
  on public.weight_logs for all
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

-- 3) Indexuri noi (dashboard sănătate: următoarele vaccinări/checkup)
create index if not exists medical_records_pet_date_idx
  on public.medical_records (pet_id, record_date desc);
create index if not exists medical_records_next_due_idx
  on public.medical_records (pet_id, next_due_date)
  where next_due_date is not null;
create index if not exists weight_logs_pet_date_idx
  on public.weight_logs (pet_id, logged_at desc);

-- 4) Comentarii
comment on table public.medical_records is
  'PetWell: fișă medicală per animal (vaccinări, tratamente, operații, alergii). Owner-only prin RLS.';
comment on table public.weight_logs is
  'PetWell: istoric greutate per animal, pentru grafic trend. Owner-only prin RLS.';
