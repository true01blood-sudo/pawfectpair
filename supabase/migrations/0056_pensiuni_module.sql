-- ──────────────────────────────────────────
-- 0056: Modul Pensiuni (cazare animale) — construit peste petday_listings (0027)
--   1) Rol nou de partener: 'pensiune' (ca 'vet'/'shop') — doar parteneri
--      verificați pot publica o unitate de cazare (nu orice user autentificat).
--   2) petday_listings: + amenities (facilități: curte, climatizare, webcam
--      live, supraveghere 24/7 etc.) și photos (galerie, pe lângă photo_url
--      ca poză de copertă).
--   3) RLS: politica veche "for all" amesteca INSERT cu UPDATE/DELETE sub
--      aceeași condiție (orice user își putea crea propriul anunț, fără
--      rol). O despart: INSERT cere rol pensiune/admin; UPDATE/DELETE rămân
--      proprietar-only. Politicile permissive se combină cu OR, deci o
--      politică INSERT nouă, restrictivă, nu era suficientă fără eliminarea
--      celei vechi, prea permisive.
--   4) petday_reviews — recenzii 1-5 stele + comentariu, o recenzie per
--      user per unitate (mirror exact pe vet_reviews din 0018).
--   5) Acces admin complet pe petday_listings/petday_bookings/petday_reviews
--      (0027 e ulterioară lui 0019, deci admin nu avea nicio politică).
-- ──────────────────────────────────────────

-- 1) Rol nou
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'vet', 'shelter', 'shop', 'pensiune', 'admin'));

-- 2) Coloane noi
alter table public.petday_listings
  add column if not exists amenities text[] not null default '{}',
  add column if not exists photos text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'petday_listings_amenities_valid'
  ) then
    alter table public.petday_listings
      add constraint petday_listings_amenities_valid
      check (
        amenities <@ array[
          'curte','climatizare','webcam_live','supraveghere_24_7','plimbari_zilnice',
          'ingrijire_medicala','grooming_inclus','transport_inclus','camere_individuale',
          'zona_joaca'
        ]::text[]
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'petday_listings_photos_max'
  ) then
    alter table public.petday_listings
      add constraint petday_listings_photos_max
      check (array_length(photos, 1) is null or array_length(photos, 1) <= 6);
  end if;
end $$;

-- 3) RLS: separă INSERT (rol-gated) de UPDATE/DELETE (owner-only)
drop policy if exists "Owners manage their petday listings" on public.petday_listings;

drop policy if exists "Partners create petday listings" on public.petday_listings;
create policy "Partners create petday listings"
  on public.petday_listings for insert
  with check (
    auth.uid() = user_id
    and (select role from public.profiles where id = auth.uid()) in ('pensiune', 'admin')
  );

drop policy if exists "Owners update their petday listings" on public.petday_listings;
create policy "Owners update their petday listings"
  on public.petday_listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners delete their petday listings" on public.petday_listings;
create policy "Owners delete their petday listings"
  on public.petday_listings for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins manage all petday listings" on public.petday_listings;
create policy "Admins manage all petday listings"
  on public.petday_listings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage all petday bookings" on public.petday_bookings;
create policy "Admins manage all petday bookings"
  on public.petday_bookings for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4) Recenzii unități de cazare
create table if not exists public.petday_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.petday_listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 600),
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

alter table public.petday_reviews enable row level security;

drop policy if exists "Petday reviews are viewable by everyone" on public.petday_reviews;
create policy "Petday reviews are viewable by everyone"
  on public.petday_reviews for select
  using (true);

drop policy if exists "Users manage their own petday review" on public.petday_reviews;
create policy "Users manage their own petday review"
  on public.petday_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage all petday reviews" on public.petday_reviews;
create policy "Admins manage all petday reviews"
  on public.petday_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists petday_reviews_listing_idx
  on public.petday_reviews (listing_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'petday_reviews'
  ) then
    alter publication supabase_realtime add table public.petday_reviews;
  end if;
end $$;

comment on table public.petday_reviews is
  'Pensiuni: recenzii (1-5 stele + comentariu) ale userilor pe unitățile de cazare din petday_listings';
