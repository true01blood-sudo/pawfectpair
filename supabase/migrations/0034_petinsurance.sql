-- ============================================================
-- 0034_petinsurance.sql — Modulul PetInsurance (aplicația MOBILĂ)
--   * insurance_policies: polițe veterinare per animal (sau familie)
--   * insurance_claims: dosar despăgubiri cu tranziții de status
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0033
-- ============================================================

-- 1) Polițe
create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  provider text not null,
  policy_number text,
  policy_type text not null default 'comprehensive'
    check (policy_type in ('accident', 'illness', 'comprehensive', 'liability')),
  premium_cents integer not null default 0
    check (premium_cents between 0 and 10000000),
  coverage_limit_cents integer
    check (coverage_limit_cents is null or coverage_limit_cents between 0 and 10000000),
  deductible_cents integer
    check (deductible_cents is null or deductible_cents between 0 and 10000000),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.insurance_policies enable row level security;

-- Date financiare personale: doar deținătorul le vede și le administrează.
drop policy if exists "Users manage own insurance policies" on public.insurance_policies;
create policy "Users manage own insurance policies"
  on public.insurance_policies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists insurance_policies_user_idx
  on public.insurance_policies (user_id, status);
create index if not exists insurance_policies_pet_idx
  on public.insurance_policies (pet_id);
create index if not exists insurance_policies_end_idx
  on public.insurance_policies (end_date) where status = 'active';

-- 2) Despăgubiri
create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  claim_date date not null,
  description text not null,
  amount_cents integer not null default 0
    check (amount_cents between 0 and 10000000),
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected', 'paid')),
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.insurance_claims enable row level security;

drop policy if exists "Users manage own insurance claims" on public.insurance_claims;
create policy "Users manage own insurance claims"
  on public.insurance_claims for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists insurance_claims_policy_idx
  on public.insurance_claims (policy_id, claim_date desc);
create index if not exists insurance_claims_user_idx
  on public.insurance_claims (user_id, status);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'insurance_policies_period_valid'
  ) then
    alter table public.insurance_policies
      add constraint insurance_policies_period_valid
      check (end_date > start_date);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'insurance_policies_provider_len'
  ) then
    alter table public.insurance_policies
      add constraint insurance_policies_provider_len
      check (char_length(trim(provider)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'insurance_policies_notes_len'
  ) then
    alter table public.insurance_policies
      add constraint insurance_policies_notes_len
      check (notes is null or char_length(notes) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'insurance_claims_desc_len'
  ) then
    alter table public.insurance_claims
      add constraint insurance_claims_desc_len
      check (char_length(trim(description)) between 10 and 1000);
  end if;
end $$;

-- 4) Realtime (statusuri de despăgubire apar live)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'insurance_policies'
  ) then
    alter publication supabase_realtime add table public.insurance_policies;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'insurance_claims'
  ) then
    alter publication supabase_realtime add table public.insurance_claims;
  end if;
end $$;

comment on table public.insurance_policies is
  'PetInsurance: polite veterinare (accident/illness/comprehensive/liability), sume in bani';
comment on table public.insurance_claims is
  'PetInsurance: dosar despagubiri (submitted → approved → paid | rejected)';
