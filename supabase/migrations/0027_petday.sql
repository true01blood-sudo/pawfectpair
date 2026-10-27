-- ============================================================
-- 0027_petday.sql — Modulul PetDay (aplicația MOBILĂ)
--   * petday_listings: oferte de pet-sitting / plimbare / cazare (pet-hotel)
--     de la persoane fizice (sitteri) și centre specializate
--   * petday_bookings: rezervări de servicii între stăpâni și ofertanți
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0026
-- ============================================================

-- 1) Oferte PetDay
create table if not exists public.petday_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_type text not null default 'sitter' check (provider_type in ('sitter', 'center')),
  title text not null,
  description text,
  services text[] not null default '{}',
  city text not null,
  address text,
  price_from numeric check (price_from is null or price_from >= 0),
  price_unit text not null default 'day' check (price_unit in ('day', 'night', 'hour', 'visit', 'walk')),
  max_pets integer check (max_pets is null or max_pets between 1 and 50),
  accepts_dogs boolean not null default true,
  accepts_cats boolean not null default true,
  accepts_other boolean not null default false,
  photo_url text,
  phone text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.petday_listings enable row level security;

-- Toată lumea vede ofertele ACTIVE; ownerul își vede și cele inactivate.
drop policy if exists "Active petday listings are public" on public.petday_listings;
create policy "Active petday listings are public"
  on public.petday_listings for select
  using (active = true or auth.uid() = user_id);

drop policy if exists "Owners manage their petday listings" on public.petday_listings;
create policy "Owners manage their petday listings"
  on public.petday_listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexuri: listare publică, filtre des folosite, căutare pe servicii
create index if not exists petday_listings_public_list_idx
  on public.petday_listings (verified, active, created_at desc);
create index if not exists petday_listings_city_idx
  on public.petday_listings (city);
create index if not exists petday_listings_provider_idx
  on public.petday_listings (provider_type);
create index if not exists petday_listings_services_idx
  on public.petday_listings using gin (services);
create index if not exists petday_listings_user_idx
  on public.petday_listings (user_id);

-- 2) Rezervări PetDay
create table if not exists public.petday_bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.petday_listings (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.petday_bookings enable row level security;

-- Văd rezervările mele (ca stăpân) și cele primite pe ofertele mele (ca ofertant).
drop policy if exists "Booking parties view bookings" on public.petday_bookings;
create policy "Booking parties view bookings"
  on public.petday_bookings for select
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.petday_listings where id = listing_id)
  );

drop policy if exists "Owners create their bookings" on public.petday_bookings;
create policy "Owners create their bookings"
  on public.petday_bookings for insert
  with check (auth.uid() = owner_id);

-- Ambele părți pot actualiza statusul (accept/reject/complete/cancel).
drop policy if exists "Booking parties update bookings" on public.petday_bookings;
create policy "Booking parties update bookings"
  on public.petday_bookings for update
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.petday_listings where id = listing_id)
  );

create index if not exists petday_bookings_owner_idx
  on public.petday_bookings (owner_id, starts_at);
create index if not exists petday_bookings_listing_idx
  on public.petday_bookings (listing_id, starts_at);
create index if not exists petday_bookings_status_idx
  on public.petday_bookings (status);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'petday_listings_title_len'
  ) then
    alter table public.petday_listings
      add constraint petday_listings_title_len
      check (char_length(trim(title)) between 3 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'petday_listings_city_len'
  ) then
    alter table public.petday_listings
      add constraint petday_listings_city_len
      check (char_length(trim(city)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'petday_listings_desc_len'
  ) then
    alter table public.petday_listings
      add constraint petday_listings_desc_len
      check (description is null or char_length(description) <= 800);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'petday_listings_services_valid'
  ) then
    alter table public.petday_listings
      add constraint petday_listings_services_valid
      check (
        services <> '{}'
        and services <@ array[
          'dog_walking','home_visits','sitting_at_owner','sitting_at_sitter',
          'daycare','boarding','transport']::text[]
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'petday_bookings_period_valid'
  ) then
    alter table public.petday_bookings
      add constraint petday_bookings_period_valid
      check (ends_at > starts_at);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'petday_bookings_note_len'
  ) then
    alter table public.petday_bookings
      add constraint petday_bookings_note_len
      check (note is null or char_length(note) <= 400);
  end if;
end $$;

-- 4) Realtime (listă oferte + rezervări actualizate live)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'petday_listings'
  ) then
    alter publication supabase_realtime add table public.petday_listings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'petday_bookings'
  ) then
    alter publication supabase_realtime add table public.petday_bookings;
  end if;
end $$;

comment on table public.petday_listings is
  'PetDay: oferte pet-sitting/plimbare/cazare (pet-hotel) — sitteri persoane fizice si centre specializate';
comment on table public.petday_bookings is
  'PetDay: rezervari servicii intre stapani si ofertanti (pending→accepted→completed / rejected / cancelled)';
