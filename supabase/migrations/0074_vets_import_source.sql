-- ──────────────────────────────────────────
-- 0074: vets — coloane de tracking pentru import extern (OSM), ca sa fie
-- idempotent (re-rularea importului actualizeaza, nu duplica).
--
-- public.vets avea doar 2 inregistrari reale, de test — pipeline-ul
-- DSVSA/OSM construit in pawfectpair-design/ nu a fost niciodata
-- conectat la aceasta baza de date (scrie intr-o baza Postgres separata,
-- locala). Portam sursa OSM (amenity=veterinary) direct aici, acelasi
-- tipar ca business_listings (0070) — rezolva si geocodarea nativ,
-- fiindca OSM vine deja cu lat/lng (spre deosebire de Nominatim, care
-- trebuie sa ghiceasca dintr-o adresa text).
--
-- user_id ramane NULABIL (0001_init.sql) — exact pattern-ul de "anunt
-- importat, revendicabil" deja existent; cabinetele importate nu au
-- cont, pot fi revendicate ulterior de un user real.
-- ──────────────────────────────────────────

alter table public.vets
  add column if not exists source text,
  add column if not exists source_id text;

create unique index if not exists vets_source_unique
  on public.vets (source, source_id)
  where source is not null;
