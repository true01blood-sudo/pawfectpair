-- ──────────────────────────────────────────
-- 0070: business_listings — director de activități conexe pe hartă
-- (magazine pentru animale, adăposturi/centre de adopție, traineri
-- listați extern), din surse publice (OSM, ACh.ro), distinct de
-- tabelele existente care presupun un cont real care deține anunțul.
--
-- De ce o tabelă nouă, nu cele existente:
--   - public.vets (0001_init.sql) are user_id NULABIL — exact
--     pattern-ul de "anunț importat, revendicabil" de care avem nevoie.
--   - public.petday_listings si public.edu_trainers au user_id NOT
--     NULL (+ unique index pe edu_trainers.user_id) — presupun un cont
--     real care a creat anunțul; nu putem insera acolo date scrapuite
--     fără să inventăm conturi false pentru oameni reali (traineri
--     ACh.ro) sau firme — inacceptabil din perspectiva datelor
--     personale, în plus ar ocoli complet fluxurile de rezervare/
--     recenzii pe care acele tabele le presupun.
--
-- category ramane extensibila; 'transport' nu e inclusa inca — sursa
-- (registrul ANSVSA) e confirmata fezabila dar importul nu a fost
-- construit inca.
--
-- Scris, dar MIGRATIA NU A FOST RULATA de Claude — doar userul o poate
-- aplica (npx supabase db push --remote), la cererea userului insusi,
-- fiindca scrierea in baza de date de productie necesita aprobarea lui
-- explicita, nu doar instructiunea generala de a "implementa sursele".
-- ──────────────────────────────────────────

create table if not exists public.business_listings (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('pet_shop', 'shelter', 'trainer')),
  name        text not null,
  city        text,
  address     text,
  lat         double precision,
  lng         double precision,
  phone       text,
  website     text,
  description text check (description is null or char_length(description) <= 600),
  source      text not null,                 -- 'osm' | 'ach'
  source_id   text not null,                 -- ex: 'node/123456', sau slug stabil pentru ACh
  verified    boolean not null default false,
  active      boolean not null default true,
  user_id     uuid references public.profiles (id) on delete set null,  -- nulabil = revendicabil
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (source, source_id)
);

alter table public.business_listings enable row level security;

drop policy if exists "Business listings are viewable by everyone" on public.business_listings;
create policy "Business listings are viewable by everyone"
  on public.business_listings for select
  using (active = true or auth.uid() = user_id or public.is_admin());

-- Niciun INSERT/UPDATE/DELETE public — importul scrie direct prin
-- conexiunea Postgres (SUPABASE_DB_URL), care ocolește RLS. Politica de
-- admin ramane pentru un eventual panou de administrare viitor.
drop policy if exists "Admins manage all business listings" on public.business_listings;
create policy "Admins manage all business listings"
  on public.business_listings for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists business_listings_category_idx
  on public.business_listings (category, active);
create index if not exists business_listings_city_idx
  on public.business_listings (city);
create index if not exists business_listings_geo_idx
  on public.business_listings (lat, lng);
