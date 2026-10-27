-- ============================================================
-- 0028_pets_pedigree_oug50.sql — Profil animal extins (aplicația MOBILĂ)
--   * pedigree: carte de origine (câini & pisici) — registru + număr
--   * cadrul legal OUG 55/2002 (câini periculoși/agresivi):
--     categorie + checklist conformitate (18+, înregistrare, microchip,
--     asigurare RC, afiș avertizare, sterilizare)
--   * Idempotent: add column if not exists — se poate rula pe orice DB
-- ============================================================

-- 1) Coloane pedigree (câini & pisici)
alter table public.pets add column if not exists pedigree_registered boolean not null default false;
alter table public.pets add column if not exists pedigree_registry text;
alter table public.pets add column if not exists pedigree_number text;

-- 2) Coloane cadrul legal OUG 55/2002
--    oug50_category: 0 = neîncadrat, 1 = categoria I (luptă/atac),
--                    2 = categoria II (agresivi)
alter table public.pets add column if not exists dangerous_breed boolean not null default false;
alter table public.pets add column if not exists oug50_category smallint not null default 0;
alter table public.pets add column if not exists oug50_owner_18 boolean not null default false;
alter table public.pets add column if not exists oug50_registration boolean not null default false;
alter table public.pets add column if not exists oug50_microchip boolean not null default false;
alter table public.pets add column if not exists oug50_insurance boolean not null default false;
alter table public.pets add column if not exists oug50_sign boolean not null default false;
alter table public.pets add column if not exists oug50_sterilized boolean not null default false;

-- 3) Constrângeri idempotente
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pets_oug50_category_range'
  ) then
    alter table public.pets
      add constraint pets_oug50_category_range
      check (oug50_category in (0, 1, 2));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pets_pedigree_registry_len'
  ) then
    alter table public.pets
      add constraint pets_pedigree_registry_len
      check (pedigree_registry is null or char_length(pedigree_registry) <= 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pets_pedigree_number_len'
  ) then
    alter table public.pets
      add constraint pets_pedigree_number_len
      check (pedigree_number is null or char_length(pedigree_number) <= 60);
  end if;
end $$;

-- 4) Index pentru filtrarea/rapoartele pe animale încadrate OUG
create index if not exists pets_oug50_category_idx
  on public.pets (oug50_category) where oug50_category > 0;

comment on column public.pets.oug50_category is
  'OUG 55/2002: 0 = neincadrat, 1 = categoria I (Pit Bull, Boerbull, Bandog), 2 = categoria II (AmStaff, Rottweiler, Tosa etc.)';
comment on column public.pets.dangerous_breed is
  'Declaratie manuala a stapanului ca animalul este din rasa potential periculoasa (poate exista si fara match automat pe numele rasei)';
comment on column public.pets.pedigree_registry is
  'Registrul de origine (ex: LRC, FCI, AKC, LO, TICA, CFA, GCCR)';
