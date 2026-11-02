-- ──────────────────────────────────────────
-- 0065: Partajare dosar medical cu un veterinar (acces temporar) +
-- pedigree/genealogie reale pentru ecranul mobil dosar.tsx/pedigree.tsx.
--
-- Pana acum ambele ecrane erau 100% date demo (DEMO_ACTIVE_SHARES,
-- DEMO_TREE), fara nicio tabela reala — gasit in audit-ul de
-- functionalitate a butoanelor. Design:
--   - Partajarea se face doar cu traineri... nu, cu VETERINARI
--     INREGISTRATI (tabela vets), nu cu text liber — verificabil, fara
--     introducerea unui nou concept de "provider extern".
--   - Acces temporar, cu expirare, revocabil de proprietar, limitat la
--     inregistrari specifice (sau toate), read-only pentru veterinar.
--   - Pedigree: nu leaga catre alte randuri din pets (stramosii pot sa nu
--     fie inregistrati in aplicatie) — e pur si simplu date text per
--     relatie (sire/dam/bunici), proprietate privata a owner-ului.
-- ──────────────────────────────────────────

-- MEDICAL RECORD SHARES ------------------------------------------------

create table if not exists public.medical_record_shares (
  id          uuid        primary key default gen_random_uuid(),
  pet_id      uuid        not null references public.pets (id) on delete cascade,
  owner_id    uuid        not null references public.profiles (id) on delete cascade,
  vet_id      uuid        not null references public.vets (id) on delete cascade,
  record_ids  uuid[],     -- null = toate inregistrarile animalului
  purpose     text        check (purpose is null or char_length(purpose) <= 120),
  expires_at  timestamptz not null,
  status      text        not null default 'active' check (status in ('active', 'revoked')),
  created_at  timestamptz not null default now(),
  check (expires_at > created_at)
);

alter table public.medical_record_shares enable row level security;

drop policy if exists "Owners and vets view relevant shares" on public.medical_record_shares;
create policy "Owners and vets view relevant shares"
  on public.medical_record_shares for select
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.vets where id = vet_id)
  );

drop policy if exists "Owners create shares for their pets" on public.medical_record_shares;
create policy "Owners create shares for their pets"
  on public.medical_record_shares for insert
  with check (
    auth.uid() = owner_id
    and auth.uid() = (select owner_id from public.pets where id = pet_id)
  );

drop policy if exists "Owners revoke their own shares" on public.medical_record_shares;
create policy "Owners revoke their own shares"
  on public.medical_record_shares for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status = 'revoked');

drop policy if exists "Admins manage all medical record shares" on public.medical_record_shares;
create policy "Admins manage all medical record shares"
  on public.medical_record_shares for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists medical_record_shares_pet_idx on public.medical_record_shares (pet_id);
create index if not exists medical_record_shares_vet_idx on public.medical_record_shares (vet_id, status);

-- Extensie RLS pe medical_records: vetul vede DOAR inregistrarile
-- acoperite de un share activ, nu-expirat, pentru animalul respectiv.
-- Policy permisiva noua, aditionala — politica existenta "Owners manage
-- their pets' medical records" (for all) ramane neschimbata, deci
-- insert/update/delete raman strict owner-only.
drop policy if exists "Vets view shared medical records" on public.medical_records;
create policy "Vets view shared medical records"
  on public.medical_records for select
  using (
    exists (
      select 1 from public.medical_record_shares s
      where s.pet_id = medical_records.pet_id
        and s.status = 'active'
        and s.expires_at > now()
        and s.vet_id in (select id from public.vets where user_id = auth.uid())
        and (s.record_ids is null or medical_records.id = any(s.record_ids))
    )
  );

-- PEDIGREE ENTRIES -------------------------------------------------------

create table if not exists public.pet_pedigree_entries (
  id              uuid        primary key default gen_random_uuid(),
  pet_id          uuid        not null references public.pets (id) on delete cascade,
  relation        text        not null check (relation in (
                    'sire', 'dam',
                    'paternal_grandsire', 'paternal_granddam',
                    'maternal_grandsire', 'maternal_granddam'
                  )),
  name            text        not null check (char_length(trim(name)) between 1 and 80),
  registered_name text        check (registered_name is null or char_length(registered_name) <= 120),
  registry        text        check (registry is null or char_length(registry) <= 40),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (pet_id, relation)
);

alter table public.pet_pedigree_entries enable row level security;

drop policy if exists "Owners manage their pets' pedigree" on public.pet_pedigree_entries;
create policy "Owners manage their pets' pedigree"
  on public.pet_pedigree_entries for all
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

drop policy if exists "Admins manage all pedigree entries" on public.pet_pedigree_entries;
create policy "Admins manage all pedigree entries"
  on public.pet_pedigree_entries for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists pet_pedigree_entries_pet_idx on public.pet_pedigree_entries (pet_id);
