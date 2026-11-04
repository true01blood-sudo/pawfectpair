-- ──────────────────────────────────────────
-- 0075: planuri de abonament — useri (Gratuit/Premium) + furnizori (Gratuit/Pro).
--
-- Decizie produs (discutată cu userul): 2 niveluri, nu 4 — Gratuit include
-- SOS, Adopții, Magazin, PetWell, PetMatch (module fără cost mare de
-- întreținere + cele care au nevoie de masă critică de useri ca să aibă
-- valoare — PetMatch/Adopții sunt inutile cu puțini useri). Premium
-- (19,99€/an) deblochează restul de 13 module + prioritate la rezervări
-- și notificări.
--
-- Promoție de lansare: oricine se înregistrează până la 30 decembrie 2026
-- primește automat Premium gratuit, cu expirare la minim(data înregistrării
-- + 6 luni, 1 iunie 2027) — adică userii inregistrati mai devreme pot primi
-- putin peste 6 luni, cei inregistrati chiar inainte de 30 decembrie sub
-- 6 luni, dar nimeni nu trece de 1 iunie 2027 cu promotia activa. De la acea
-- data, toata lumea alege explicit un plan (gratuit sau platit).
--
-- Platile nu se fac din aplicatia mobila (doar web) — coloanele de mai jos
-- doar STOCHEAZA planul curent; logica efectiva de school/verificare acces
-- se face in aplicatie, citind aceste coloane.
-- ──────────────────────────────────────────

alter table public.profiles
  add column if not exists plan text not null default 'free' check (plan in ('free', 'premium')),
  add column if not exists plan_source text check (plan_source in ('promo_launch', 'purchased')),
  add column if not exists plan_expires_at timestamptz;

create or replace function public.grant_launch_promo_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if now() < timestamptz '2026-12-30 23:59:59+02' then
    new.plan := 'premium';
    new.plan_source := 'promo_launch';
    new.plan_expires_at := least(now() + interval '6 months', timestamptz '2027-06-01 00:00:00+03');
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_created_grant_promo on public.profiles;
create trigger on_profile_created_grant_promo
  before insert on public.profiles
  for each row execute procedure public.grant_launch_promo_plan();

-- Backfill: cine s-a inregistrat deja inainte de lansarea acestei promotii
-- (profiluri existente, create inainte de cutoff) primeste si el promotia,
-- ca sa nu fie penalizat fata de userii care se inregistreaza de-acum.
update public.profiles
set plan = 'premium',
    plan_source = 'promo_launch',
    plan_expires_at = least(created_at + interval '6 months', timestamptz '2027-06-01 00:00:00+03')
where created_at < timestamptz '2026-12-30 23:59:59+02'
  and plan_source is null;

-- ────────────────────────────── Furnizori: Gratuit / Pro ───────────────
-- "Pro" = listare revendicata + plina (badge verificat, prioritate in
-- cautare/harta, accepta rezervari prin aplicatie, statistici). pro_until
-- null sau in trecut = nivel gratuit (listare de baza, exact ce avem azi
-- pentru cele ~1.700 de locatii importate din OSM/ANSVSA/ACh).
alter table public.vets add column if not exists pro_until timestamptz;
alter table public.edu_trainers add column if not exists pro_until timestamptz;
alter table public.petday_listings add column if not exists pro_until timestamptz;
alter table public.business_listings add column if not exists pro_until timestamptz;
