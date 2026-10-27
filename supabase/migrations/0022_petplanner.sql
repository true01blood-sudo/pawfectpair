-- ============================================================
-- 0022_petplanner.sql — Modul PetPlanner (aplicația MOBILĂ)
-- Program de activități & reminder-uri pentru animale.
--
-- Compatibil cu 0011_petplanner_petedu.sql (web):
--   * dacă 0011 a rulat deja → tabela există, aici doar adăugăm
--     indexuri + realtime + re-confirmăm RLS (totul idempotent);
--   * dacă 0011 NU a rulat → creează tabela completă de la zero.
-- ============================================================

-- 1) Tabela (idempotent)
create table if not exists public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in ('feeding', 'walk', 'grooming', 'medication', 'other')),
  due_at timestamptz not null,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekly')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) RLS (idempotent)
alter table public.planner_tasks enable row level security;

drop policy if exists "Owners manage their own planner tasks" on public.planner_tasks;
create policy "Owners manage their own planner tasks"
  on public.planner_tasks for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 3) Indexuri pentru interogări rapide (listă per owner / per animal / pe termen)
create index if not exists planner_tasks_owner_idx on public.planner_tasks (owner_id, done, due_at);
create index if not exists planner_tasks_pet_idx on public.planner_tasks (pet_id, due_at);
create index if not exists planner_tasks_due_idx on public.planner_tasks (due_at);

-- 4) Realtime: activează planner_tasks pentru actualizare live în listă
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'planner_tasks'
  ) then
    alter publication supabase_realtime add table public.planner_tasks;
  end if;
end $$;

-- 5) Constraint lungime titlu (PostgreSQL nu suportă IF NOT EXISTS pe constrângeri)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'planner_tasks_title_len'
      and conrelid = 'public.planner_tasks'::regclass
  ) then
    alter table public.planner_tasks
      add constraint planner_tasks_title_len check (char_length(title) between 1 and 80);
  end if;
exception
  when duplicate_object then null; -- rulat în paralel pe alt mediu
end $$;

-- 6) Comentarii documentare
comment on table public.planner_tasks is
  'PetPlanner: activități planificate per animal (hrănire, plimbare, îngrijire, medicație). Owner-scoped prin RLS.';
