-- ──────────────────────────────────────────
-- 0060: Redesign Veterinari — conform mockup 4.png ("Lake Vet Clinic"):
-- galerie foto, badge-uri de încredere, tab-uri About/Services/Reviews,
-- servicii cu preț și "Choose a time".
--
-- vets (0001) are doar clinic_name/city/address/phone/bio — fără poză,
-- fără badge-uri, fără catalog de servicii. Cabinetele nici nu aveau
-- cum să-și editeze profilul după înregistrare (clinic/profil
-- redirecta spre pagina publică, care nu avea nicio formă de editare).
-- ──────────────────────────────────────────

alter table public.vets
  add column if not exists photo_url text,
  add column if not exists photos text[] not null default '{}',
  add column if not exists is_licensed boolean not null default false,
  add column if not exists experienced_team boolean not null default false,
  add column if not exists modern_facility boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vets_photos_max'
  ) then
    alter table public.vets
      add constraint vets_photos_max
      check (array_length(photos, 1) is null or array_length(photos, 1) <= 6);
  end if;
end $$;

-- Servicii oferite de cabinet (preț + durată) — afișate pe tab-ul "Services".
create table if not exists public.vet_services (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references public.vets (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 5 and 480),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'RON',
  created_at timestamptz not null default now()
);

alter table public.vet_services enable row level security;

drop policy if exists "Vet services are viewable by everyone" on public.vet_services;
create policy "Vet services are viewable by everyone"
  on public.vet_services for select
  using (true);

drop policy if exists "Vet owners manage their services" on public.vet_services;
create policy "Vet owners manage their services"
  on public.vet_services for all
  using (auth.uid() = (select user_id from public.vets where id = vet_id))
  with check (auth.uid() = (select user_id from public.vets where id = vet_id));

drop policy if exists "Admins manage all vet services" on public.vet_services;
create policy "Admins manage all vet services"
  on public.vet_services for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists vet_services_vet_idx on public.vet_services (vet_id);
