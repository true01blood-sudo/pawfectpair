-- ============================================================
-- 0023_adoptii.sql — Modul Adopții (aplicația MOBILĂ)
-- Tabelele adoption_listings + adoption_applications există deja în
-- 0001_init.sql (web). Această extensie idempotentă adaugă:
--   * indexuri pentru filtre rapide (specie, oraș, status, dată)
--   * realtime pe anunțuri (listă live în aplicația mobilă)
--   * re-confirmare RLS (dacă 0001 nu a rulat pe mediu nou)
-- ============================================================

-- 1) Tabele idempotente (pentru medii noi, fără 0001)
create table if not exists public.adoption_listings (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  age_years numeric,
  sex text check (sex in ('male', 'female', 'unknown')),
  size text check (size in ('small', 'medium', 'large')),
  description text,
  city text,
  photo_url text,
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

-- 2) RLS — identic cu 0001 (idempotent)
alter table public.adoption_listings enable row level security;
alter table public.adoption_applications enable row level security;

drop policy if exists "Adoption listings are viewable by everyone" on public.adoption_listings;
create policy "Adoption listings are viewable by everyone"
  on public.adoption_listings for select
  using (true);

drop policy if exists "Posters manage their own listings" on public.adoption_listings;
create policy "Posters manage their own listings"
  on public.adoption_listings for all
  using (auth.uid() = posted_by)
  with check (auth.uid() = posted_by);

drop policy if exists "Applicants view their own applications" on public.adoption_applications;
create policy "Applicants view their own applications"
  on public.adoption_applications for select
  using (
    auth.uid() = applicant_id
    or auth.uid() = (select posted_by from public.adoption_listings where id = listing_id)
  );

drop policy if exists "Users can apply to listings" on public.adoption_applications;
create policy "Users can apply to listings"
  on public.adoption_applications for insert
  with check (auth.uid() = applicant_id);

drop policy if exists "Applicants can withdraw, posters can decide" on public.adoption_applications;
create policy "Applicants can withdraw, posters can decide"
  on public.adoption_applications for update
  using (
    auth.uid() = applicant_id
    or auth.uid() = (select posted_by from public.adoption_listings where id = listing_id)
  );

-- 3) Indexuri (noi față de 0001)
create index if not exists adoption_listings_status_idx
  on public.adoption_listings (status, created_at desc);
create index if not exists adoption_listings_species_idx
  on public.adoption_listings (species);
create index if not exists adoption_listings_city_idx
  on public.adoption_listings (city);
create index if not exists adoption_applications_listing_idx
  on public.adoption_applications (listing_id, status);
create index if not exists adoption_applications_applicant_idx
  on public.adoption_applications (applicant_id);

-- 4) Realtime pe anunțuri (listă live)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'adoption_listings'
  ) then
    alter publication supabase_realtime add table public.adoption_listings;
  end if;
end $$;

-- 5) Comentarii
comment on table public.adoption_listings is
  'Adopții: anunțuri de adoptare, vizibile public, gestionate de autor prin RLS.';
comment on table public.adoption_applications is
  'Adopții: aplicații la anunțuri; applicant + poster au acces prin RLS.';
