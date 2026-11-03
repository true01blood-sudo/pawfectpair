-- ──────────────────────────────────────────
-- 0072: coordonate pentru vets — in acest moment public.vets are doar
-- city/address text, fara lat/lng deloc. Asta inseamna ca veterinarii nu
-- pot aparea ca pini pe harta (mobil) sau in /aproape (web) — doar in
-- lista, fara distanta reala (vezi harta.tsx si petsos.tsx, unde asta e
-- documentat explicit in cod).
--
-- Coloane pur aditive, nulabile — nimic altceva nu se schimba. Populate
-- separat, prin geocodare (scripts/business-import/geocode-vets.js,
-- Nominatim/OSM — fara cheie API Google disponibila in acest proiect
-- pentru geocodare server-side).
--
-- Scris, dar MIGRATIA NU A FOST RULATA de Claude — doar userul o poate
-- aplica (npx supabase db push --remote), acelasi motiv ca la toate
-- migratiile din aceasta sesiune: scrierea in baza de date de productie
-- necesita aprobarea lui explicita.
-- ──────────────────────────────────────────

alter table public.vets add column if not exists lat double precision;
alter table public.vets add column if not exists lng double precision;

create index if not exists vets_geo_idx on public.vets (lat, lng);
