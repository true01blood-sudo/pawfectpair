-- ──────────────────────────────────────────
-- 0062: Rezervări reale pentru traineri (edu_trainers).
--
-- Contextul deciziei: mobilul folosește edu_trainers (0026_petedu.sql) ca
-- director public de traineri — e tabela pe care Explore și profilul de
-- detaliu din mobil o citesc deja. Există și un sistem separat,
-- neconectat — trainers/training_plans/training_bookings (0041) — folosit
-- doar de web, unde /antrenament leagă spre 3 pagini care nu există deloc
-- (404 în producție: antrenori/[id], rezerva/[id], intake). Decizia:
-- edu_trainers rămâne sursa de adevăr pentru profilul de trainer; acest
-- fișier îi adaugă o tabelă de rezervări proprie, simetrică cu
-- vet_appointments (0001), ca mobilul să poată scrie o programare reală.
-- Consolidarea/retragerea sistemului trainers/training_bookings de pe web
-- rămâne o decizie separată, nu e atinsă aici.
-- ──────────────────────────────────────────

create table if not exists public.trainer_bookings (
  id            uuid        primary key default gen_random_uuid(),
  trainer_id    uuid        not null references public.edu_trainers (id) on delete cascade,
  pet_id        uuid        not null references public.pets (id) on delete cascade,
  owner_id      uuid        not null references public.profiles (id) on delete cascade,
  requested_at  timestamptz not null,
  notes         text        check (notes is null or char_length(notes) <= 500),
  status        text        not null default 'requested'
                             check (status in ('requested', 'confirmed', 'declined', 'cancelled', 'completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.trainer_bookings enable row level security;

-- Clientul (owner_id) și trainerul (owner-ul profilului edu_trainers) văd rezervarea.
drop policy if exists "Owners and trainers view relevant bookings" on public.trainer_bookings;
create policy "Owners and trainers view relevant bookings"
  on public.trainer_bookings for select
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.edu_trainers where id = trainer_id)
  );

-- Clientul creează rezervarea, doar pentru animale proprii.
drop policy if exists "Owners create bookings for their pets" on public.trainer_bookings;
create policy "Owners create bookings for their pets"
  on public.trainer_bookings for insert
  with check (
    auth.uid() = owner_id
    and auth.uid() = (select owner_id from public.pets where id = pet_id)
  );

-- Clientul își poate anula rezervarea; trainerul poate confirma/respinge/finaliza.
drop policy if exists "Owners and trainers update relevant bookings" on public.trainer_bookings;
create policy "Owners and trainers update relevant bookings"
  on public.trainer_bookings for update
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.edu_trainers where id = trainer_id)
  );

drop policy if exists "Admins manage all trainer bookings" on public.trainer_bookings;
create policy "Admins manage all trainer bookings"
  on public.trainer_bookings for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists trainer_bookings_trainer_idx on public.trainer_bookings (trainer_id, requested_at);
create index if not exists trainer_bookings_owner_idx   on public.trainer_bookings (owner_id);
create index if not exists trainer_bookings_status_idx  on public.trainer_bookings (status);
