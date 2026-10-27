-- ============================================================
-- 0025_petsos.sql — Modul PetSOS (aplicația MOBILĂ)
-- Extinde 0013_petsos.sql (web) cu:
--   * coloane emergency_contact_name/phone pe pets (contact rapid)
--   * indexuri pe istoric evenimente
--   * realtime pe sos_events (reacție instantă în aplicație)
-- Toate operațiile sunt idempotente.
-- ============================================================

-- 1) Contact de urgență pe animal (idempotent)
alter table public.pets add column if not exists emergency_contact_name text;
alter table public.pets add column if not exists emergency_contact_phone text;

-- limitare format telefon (opțională, defensivă): cifre, spații, + - ( )
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pets_emergency_phone_format'
      and conrelid = 'public.pets'::regclass
  ) then
    alter table public.pets
      add constraint pets_emergency_phone_format
      check (emergency_contact_phone is null
             or emergency_contact_phone ~ '^[+()0-9\s-]{6,20}$');
  end if;
exception
  when duplicate_object then null;
end $$;

-- 2) Tabela sos_events (idempotent, pentru medii noi fără 0013)
create table if not exists public.sos_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('medical', 'lost', 'danger')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sos_events enable row level security;

drop policy if exists "Owners manage their own SOS events" on public.sos_events;
create policy "Owners manage their own SOS events"
  on public.sos_events for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 3) Indexuri
create index if not exists sos_events_owner_idx
  on public.sos_events (owner_id, created_at desc);
create index if not exists sos_events_pet_idx
  on public.sos_events (pet_id, created_at desc);

-- 4) Realtime pe sos_events (istoric live)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sos_events'
  ) then
    alter publication supabase_realtime add table public.sos_events;
  end if;
end $$;

-- 5) Comentarii
comment on column public.pets.emergency_contact_name is
  'PetSOS: nume contact urgență (vet/relativ), afișat pe ecranul SOS.';
comment on column public.pets.emergency_contact_phone is
  'PetSOS: telefon contact urgență, format internațional recomandat (+40...).';
comment on table public.sos_events is
  'PetSOS: istoric evenimente urgență (medical/pierdut/pericol), owner-only prin RLS.';
