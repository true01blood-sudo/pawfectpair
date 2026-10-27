-- ============================================================
-- 0033_petresq.sql — Modulul PetResQ (aplicația MOBILĂ)
--   * resq_cases: animale pierdute/găsite (compatibil 0015 upstream)
--   * resq_tips: NOU — sfaturi comunitare pe fiecare caz
--     („am văzut animalul la...", indicii, confirmări)
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0032
-- ============================================================

-- 1) Cazuri (idempotent cu 0015_petresq.sql din repo-ul web)
create table if not exists public.resq_cases (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  type text not null check (type in ('lost', 'found')),
  name text not null,
  species text not null,
  description text,
  city text,
  last_seen_location text,
  contact_phone text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resq_cases enable row level security;

-- Toată lumea vede cazurile (alertele comunitare trebuie să circule rapid).
drop policy if exists "ResQ cases are viewable by everyone" on public.resq_cases;
create policy "ResQ cases are viewable by everyone"
  on public.resq_cases for select
  using (true);

drop policy if exists "Reporters manage their own ResQ cases" on public.resq_cases;
create policy "Reporters manage their own ResQ cases"
  on public.resq_cases for all
  using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id);

create index if not exists resq_cases_type_status_idx
  on public.resq_cases (status, type, created_at desc);
create index if not exists resq_cases_city_idx
  on public.resq_cases (city);
create index if not exists resq_cases_reporter_idx
  on public.resq_cases (reporter_id);

-- 2) Sfaturi comunitare (NOU)
create table if not exists public.resq_tips (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.resq_cases (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.resq_tips enable row level security;

-- Sfaturile unui caz public sunt vizibile tuturor (colaborare urgentă).
drop policy if exists "ResQ tips are viewable by everyone" on public.resq_tips;
create policy "ResQ tips are viewable by everyone"
  on public.resq_tips for select
  using (true);

drop policy if exists "Users manage their own ResQ tips" on public.resq_tips;
create policy "Users manage their own ResQ tips"
  on public.resq_tips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists resq_tips_case_idx
  on public.resq_tips (case_id, created_at desc);
create index if not exists resq_tips_user_idx
  on public.resq_tips (user_id);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resq_cases_name_len'
  ) then
    alter table public.resq_cases
      add constraint resq_cases_name_len
      check (char_length(trim(name)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'resq_cases_desc_len'
  ) then
    alter table public.resq_cases
      add constraint resq_cases_desc_len
      check (description is null or char_length(description) between 10 and 1000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'resq_cases_city_len'
  ) then
    alter table public.resq_cases
      add constraint resq_cases_city_len
      check (city is null or char_length(trim(city)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'resq_tips_msg_len'
  ) then
    alter table public.resq_tips
      add constraint resq_tips_msg_len
      check (char_length(trim(message)) between 2 and 500);
  end if;
end $$;

-- 4) Realtime (cazuri noi apar live în feed — timp critic la pierderi)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'resq_cases'
  ) then
    alter publication supabase_realtime add table public.resq_cases;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'resq_tips'
  ) then
    alter publication supabase_realtime add table public.resq_tips;
  end if;
end $$;

comment on table public.resq_cases is
  'PetResQ: animale pierdute/gasite — raportari comunitare (active/resolved)';
comment on table public.resq_tips is
  'PetResQ: sfaturi comunitare pe cazuri (indicii de vazut/confirmari)';
