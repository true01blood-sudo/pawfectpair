-- ──────────────────────────────────────────
-- 0059: Redesign Reproducție — conform mockup-urilor din pawfectpair-design/
-- (petcare-petmatch.png — listă cu rating/pedigree/pui; petcare-petmatch-
-- profile.png — profil cu tab-uri Overview/Pedigree/Health/Photos/Litters).
--
-- breeding_listings (0042) are doar o poză, fără titluri/premii/pui — iar
-- tab-urile "Premii"/"Pui"/"Recenzii" din BreedingDetailClient.tsx erau
-- placeholder-e statice, fără date reale în spate.
-- ──────────────────────────────────────────

alter table public.breeding_listings
  add column if not exists photos text[] not null default '{}',
  add column if not exists is_champion boolean not null default false,
  add column if not exists awards text[] not null default '{}',
  add column if not exists litters_count integer not null default 0,
  add column if not exists offspring_count integer not null default 0,
  add column if not exists offspring_photos text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'breeding_listings_photos_max'
  ) then
    alter table public.breeding_listings
      add constraint breeding_listings_photos_max
      check (array_length(photos, 1) is null or array_length(photos, 1) <= 6);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'breeding_listings_offspring_photos_max'
  ) then
    alter table public.breeding_listings
      add constraint breeding_listings_offspring_photos_max
      check (array_length(offspring_photos, 1) is null or array_length(offspring_photos, 1) <= 8);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'breeding_listings_awards_max'
  ) then
    alter table public.breeding_listings
      add constraint breeding_listings_awards_max
      check (array_length(awards, 1) is null or array_length(awards, 1) <= 10);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'breeding_listings_counts_valid'
  ) then
    alter table public.breeding_listings
      add constraint breeding_listings_counts_valid
      check (litters_count >= 0 and offspring_count >= 0);
  end if;
end $$;

-- Recenzii crescător (mirror exact pe vet_reviews/petday_reviews)
create table if not exists public.breeding_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.breeding_listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 600),
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

alter table public.breeding_reviews enable row level security;

drop policy if exists "Breeding reviews are viewable by everyone" on public.breeding_reviews;
create policy "Breeding reviews are viewable by everyone"
  on public.breeding_reviews for select
  using (true);

drop policy if exists "Users manage their own breeding review" on public.breeding_reviews;
create policy "Users manage their own breeding review"
  on public.breeding_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage all breeding reviews" on public.breeding_reviews;
create policy "Admins manage all breeding reviews"
  on public.breeding_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists breeding_reviews_listing_idx
  on public.breeding_reviews (listing_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'breeding_reviews'
  ) then
    alter publication supabase_realtime add table public.breeding_reviews;
  end if;
end $$;

comment on table public.breeding_reviews is
  'Reproducție: recenzii (1-5 stele + comentariu) ale userilor pe anunțurile de reproducție';
