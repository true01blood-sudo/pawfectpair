-- ============================================================
-- 0035_petlegacy.sql — Modulul PetLegacy (aplicația MOBILĂ)
--   * legacy_plans: plan de îngrijire „dacă nu mai pot avea grijă"
--     (îngrijitor desemnat, instrucțiuni, buget, dorințe)
--   * pet_memorials: memorial digital pentru animalele plecate
--     (tribut, amintire, poză, loc de odihnă, opțional public)
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0034
-- ============================================================

-- 1) Planuri de îngrijire
create table if not exists public.legacy_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  guardian_name text not null,
  guardian_phone text,
  guardian_email text,
  instructions text,
  care_budget_cents integer
    check (care_budget_cents is null or care_budget_cents between 0 and 10000000),
  wishes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.legacy_plans enable row level security;

-- Date sensibile (urgență/familie): doar deținătorul le vede.
drop policy if exists "Users manage own legacy plans" on public.legacy_plans;
create policy "Users manage own legacy plans"
  on public.legacy_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists legacy_plans_user_idx
  on public.legacy_plans (user_id);
create index if not exists legacy_plans_pet_idx
  on public.legacy_plans (pet_id);

-- 2) Memoriale
create table if not exists public.pet_memorials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  pet_name text not null,
  species text,
  photo_url text,
  tribute text,
  favorite_memory text,
  passed_at date not null,
  resting_place text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pet_memorials enable row level security;

-- Memorialele publice (omagiu) sunt vizibile tuturor; restul doar deținătorului.
drop policy if exists "Public memorials are viewable by everyone" on public.pet_memorials;
create policy "Public memorials are viewable by everyone"
  on public.pet_memorials for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Users manage own memorials" on public.pet_memorials;
create policy "Users manage own memorials"
  on public.pet_memorials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists pet_memorials_user_idx
  on public.pet_memorials (user_id, passed_at desc);
create index if not exists pet_memorials_public_idx
  on public.pet_memorials (is_public, passed_at desc);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'legacy_plans_guardian_len'
  ) then
    alter table public.legacy_plans
      add constraint legacy_plans_guardian_len
      check (char_length(trim(guardian_name)) between 2 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'legacy_plans_instructions_len'
  ) then
    alter table public.legacy_plans
      add constraint legacy_plans_instructions_len
      check (instructions is null or char_length(instructions) <= 1000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_memorials_name_len'
  ) then
    alter table public.pet_memorials
      add constraint pet_memorials_name_len
      check (char_length(trim(pet_name)) between 1 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_memorials_tribute_len'
  ) then
    alter table public.pet_memorials
      add constraint pet_memorials_tribute_len
      check (tribute is null or char_length(tribute) <= 1500);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_memorials_passed_valid'
  ) then
    alter table public.pet_memorials
      add constraint pet_memorials_passed_valid
      check (passed_at <= current_date);
  end if;
end $$;

-- 4) Realtime (memoriale publice noi apar live — nu este critic, dar consisten)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'legacy_plans'
  ) then
    alter publication supabase_realtime add table public.legacy_plans;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'pet_memorials'
  ) then
    alter publication supabase_realtime add table public.pet_memorials;
  end if;
end $$;

comment on table public.legacy_plans is
  'PetLegacy: plan de ingrijire pentru Situatii de Urgenta (ingrijitor desemnat + dorinte)';
comment on table public.pet_memorials is
  'PetLegacy: memorial digital (tribut, amintire, poză, loc de odihnă; public opțional)';
