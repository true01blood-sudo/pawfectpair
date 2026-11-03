-- ──────────────────────────────────────────
-- 0068: Reconciliaza insurance_policies/insurance_claims cu schema pe
-- care o asteapta TOT codul aplicatiei (0034_petinsurance.sql).
--
-- Gasit la raportul userului: "null value in column ... violates
-- not-null constraint" la adaugarea unei asigurari noi.
--
-- Explicatia: 0042_gps_breeding_insurance.sql defineste INCA O DATA
-- insurance_policies/insurance_claims, cu alte nume de coloane
-- (owner_id/provider_name/annual_premium_cents/coverage_type, end_date
-- nullable, fara notes/updated_at) — foloseste CREATE TABLE IF NOT
-- EXISTS si are chiar un comentariu explicit ca stie ca tabelele "deja
-- exista din 0034". Insa, pe acest proiect, se pare ca 0042 a fost cea
-- care a creat efectiv tabelele (0034 nu a mai rulat / IF NOT EXISTS a
-- sarit-o) — deci baza de date reala are schema veche din 0042, in timp
-- ce ABSOLUT tot codul aplicatiei (tipuri, scheme Zod, query-urile
-- mobil) e scris pentru schema din 0034. De-asta provider_name (NOT
-- NULL, fara default) nu primea niciodata valoare — aplicatia trimite
-- `provider`, coloana reala se numea `provider_name`.
--
-- Fix: readucem coloanele la numele din 0034 (idempotent — ruleaza
-- sigur indiferent care varianta e deja live), reparam constrangerea
-- CHECK de pe policy_type (valorile din 0042 — basic/comprehensive/
-- premium — nu coincid cu cele din 0034 — accident/illness/
-- comprehensive/liability) si adaugam coloanele lipsa (notes,
-- updated_at).
-- ──────────────────────────────────────────

-- insurance_policies: owner_id -> user_id
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='owner_id')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='user_id') then
    alter table public.insurance_policies rename column owner_id to user_id;
  end if;
end $$;

-- provider_name -> provider
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='provider_name')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='provider') then
    alter table public.insurance_policies rename column provider_name to provider;
  end if;
end $$;

-- annual_premium_cents -> premium_cents
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='annual_premium_cents')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='premium_cents') then
    alter table public.insurance_policies rename column annual_premium_cents to premium_cents;
  end if;
end $$;

-- coverage_type -> policy_type, + repara valorile permise (CHECK)
do $$
declare
  cons record;
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='coverage_type')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_policies' and column_name='policy_type') then
    alter table public.insurance_policies rename column coverage_type to policy_type;
  end if;

  -- indiferent de ramura de mai sus, ne asiguram ca orice CHECK pe
  -- policy_type foloseste valorile corecte din 0034 (accident/illness/
  -- comprehensive/liability), nu cele vechi (basic/comprehensive/premium).
  for cons in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'insurance_policies'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%policy_type%'
  loop
    execute format('alter table public.insurance_policies drop constraint %I', cons.conname);
  end loop;

  alter table public.insurance_policies
    add constraint insurance_policies_policy_type_check
    check (policy_type in ('accident', 'illness', 'comprehensive', 'liability'));
exception when others then
  -- daca tabela/coloana nu exista inca in aceasta forma, nu blocam restul migratiei
  null;
end $$;

-- Coloane lipsa pe care tot codul le asteapta
alter table public.insurance_policies add column if not exists notes text;
alter table public.insurance_policies add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'insurance_policies_notes_len'
  ) then
    alter table public.insurance_policies
      add constraint insurance_policies_notes_len
      check (notes is null or char_length(notes) <= 500);
  end if;
end $$;

-- insurance_claims: owner_id -> user_id (aceeasi problema)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_claims' and column_name='owner_id')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_claims' and column_name='user_id') then
    alter table public.insurance_claims rename column owner_id to user_id;
  end if;
end $$;

-- title -> nimic (0034 nu are `title`, are `description` not null) —
-- daca title exista, mutam continutul in description inainte de a
-- renunta la cerinta NOT NULL pe title.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_claims' and column_name='title')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_claims' and column_name='description') then
    update public.insurance_claims set description = coalesce(nullif(trim(description), ''), title) where description is null or trim(description) = '';
    alter table public.insurance_claims alter column title drop not null;
  end if;
exception when others then null;
end $$;

alter table public.insurance_claims add column if not exists claim_date date not null default current_date;
alter table public.insurance_claims add column if not exists decision_note text;
alter table public.insurance_claims add column if not exists updated_at timestamptz not null default now();

-- orice descriere ramasa goala (date vechi incomplete) primeste un
-- placeholder, ca sa putem impune NOT NULL fara sa pierdem randuri.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='insurance_claims' and column_name='description') then
    update public.insurance_claims set description = 'N/A' where description is null or trim(description) = '';
    alter table public.insurance_claims alter column description set not null;
  end if;
exception when others then null;
end $$;

do $$
declare
  cons record;
begin
  for cons in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'insurance_claims'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.insurance_claims drop constraint %I', cons.conname);
  end loop;

  alter table public.insurance_claims
    add constraint insurance_claims_status_check
    check (status in ('submitted', 'approved', 'rejected', 'paid'));
exception when others then
  null;
end $$;

-- RLS: ne asiguram ca politicile din 0034 exista, indiferent ce a rulat ultimul
alter table public.insurance_policies enable row level security;
alter table public.insurance_claims enable row level security;

drop policy if exists "Users manage own insurance policies" on public.insurance_policies;
create policy "Users manage own insurance policies"
  on public.insurance_policies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own insurance claims" on public.insurance_claims;
create policy "Users manage own insurance claims"
  on public.insurance_claims for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
