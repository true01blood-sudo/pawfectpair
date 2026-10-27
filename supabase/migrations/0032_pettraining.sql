-- ============================================================
-- 0032_pettraining.sql — Modulul PetTraining (aplicația MOBILĂ)
--   * training_skills: abilități/comezi per animal (categorii, dificultate,
--     țintă sesiuni, status learning/paused/mastered)
--   * training_sessions: sesiuni de antrenament (durată, rating, note)
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0031
-- ============================================================

-- 1) Abilități
create table if not exists public.training_skills (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null default 'basic'
    check (category in ('basic', 'obedience', 'tricks', 'agility', 'behavior', 'cognitive')),
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  target_sessions integer not null default 10 check (target_sessions between 1 and 200),
  status text not null default 'learning' check (status in ('learning', 'paused', 'mastered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_skills enable row level security;

-- Date personale: doar deținătorul își vede și își administrează abilitățile.
drop policy if exists "Users manage own training skills" on public.training_skills;
create policy "Users manage own training skills"
  on public.training_skills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists training_skills_pet_idx
  on public.training_skills (pet_id, status);
create index if not exists training_skills_user_idx
  on public.training_skills (user_id);
create index if not exists training_skills_category_idx
  on public.training_skills (category);

-- 2) Sesiuni de antrenament
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.training_skills (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  duration_minutes integer not null check (duration_minutes between 1 and 180),
  rating integer not null default 3 check (rating between 1 and 5),
  notes text,
  practiced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.training_sessions enable row level security;

drop policy if exists "Users manage own training sessions" on public.training_sessions;
create policy "Users manage own training sessions"
  on public.training_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists training_sessions_skill_idx
  on public.training_sessions (skill_id, practiced_at desc);
create index if not exists training_sessions_user_idx
  on public.training_sessions (user_id, practiced_at desc);
create index if not exists training_sessions_pet_idx
  on public.training_sessions (pet_id);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'training_skills_name_len'
  ) then
    alter table public.training_skills
      add constraint training_skills_name_len
      check (char_length(trim(name)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'training_sessions_notes_len'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_notes_len
      check (notes is null or char_length(notes) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'training_sessions_past'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_past
      check (practiced_at <= now() + interval '1 day');
  end if;
end $$;

-- 4) Realtime (sesiunile noi apar live în progres)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'training_skills'
  ) then
    alter publication supabase_realtime add table public.training_skills;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'training_sessions'
  ) then
    alter publication supabase_realtime add table public.training_sessions;
  end if;
end $$;

comment on table public.training_skills is
  'PetTraining: abilitati/comezi per animal (basic/obedience/tricks/agility/behavior/cognitive)';
comment on table public.training_sessions is
  'PetTraining: sesiuni de antrenament (durata 1-180 min, rating 1-5, note)';
