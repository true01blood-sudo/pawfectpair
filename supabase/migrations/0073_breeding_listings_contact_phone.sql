-- ──────────────────────────────────────────
-- 0073: breeding_listings.contact_phone — coloana lipsea complet din DB.
--
-- Raport user: "la petbreeding daca dau click pe el imi iese direct din
-- aplicatie" (crash la deschiderea ecranului).
--
-- Cauza: mai devreme in aceasta sesiune, mobile/lib/supabase/queries.ts
-- (fetchBreedingListings) a fost modificat sa ceara coloana
-- contact_phone (pentru butonul real "Suna crescatorul"), presupunand
-- gresit ca exista deja in breeding_listings. Nu exista — 0042 a creat
-- tabela (fara contact_phone), 0059 a mai adaugat photos/is_champion/
-- awards/litters_count/offspring_count/offspring_photos, dar niciodata
-- contact_phone. PostgREST respinge intregul select cu "column
-- breeding_listings.contact_phone does not exist", deci orice incercare
-- de a incarca ecranul PetBreeding esueaza la prima interogare.
--
-- Fix: adaugam coloana reala (nu o eliminam din query — functionalitatea
-- de "suna crescatorul" e reala si dorita, doar coloana lipsea).
-- ──────────────────────────────────────────

alter table public.breeding_listings
  add column if not exists contact_phone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'breeding_listings_contact_phone_format'
  ) then
    alter table public.breeding_listings
      add constraint breeding_listings_contact_phone_format
      check (contact_phone is null or contact_phone ~ '^[+()0-9\s-]{6,20}$');
  end if;
end $$;

notify pgrst, 'reload schema';
