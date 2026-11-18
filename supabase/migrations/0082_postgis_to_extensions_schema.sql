-- ──────────────────────────────────────────
-- 0082: muta PostGIS din public in extensions — rezolva findingurile
-- Security Advisor pe spatial_ref_sys / geography_columns / geometry_columns
--
-- Raspunsul Supabase support: aceste tabele/view-uri apartin de extensia
-- postgis, instalata de supabase_admin in schema public. Doar owner-ul
-- poate activa RLS sau revoca grant-urile pe ele — de-aia ALTER TABLE
-- ENABLE ROW LEVEL SECURITY si REVOKE esueaza/nu fac nimic (vezi ticket).
-- Fix-ul recomandat: muta extensia in schema `extensions`, care nu e
-- expusa prin Data API — findingurile dispar fara sa schimbam vreun grant.
--
-- Verificat inainte de a scrie asta (citeste-only, pg_catalog):
--   - search_path e deja '"$user", public, extensions' — apelurile
--     neschimbate la st_makepoint/geography/st_dwithin din index-uri si
--     din get_tokens_in_radius() raman valide dupa mutare, fara nicio
--     schimbare de cod.
--   - Niciun column din proiect nu e de tip geometry/geography (doar
--     lat/lng ca double precision) — spatial_ref_sys se repopuleaza
--     automat la reinstalare (date standard EPSG, nu date proprii),
--     deci nu exista nicio pierdere de date posibila aici.
--   - Singurele obiecte dependente: 2 indexuri GIST (push_tokens_geo_idx,
--     resq_cases_geo_idx din migratia 0038) — recreate identic mai jos.
-- ──────────────────────────────────────────

drop extension if exists postgis cascade;
create extension if not exists postgis schema extensions;

create index if not exists push_tokens_geo_idx
  on public.push_tokens
  using gist (geography(st_makepoint(lng, lat)))
  where lat is not null and lng is not null;

create index if not exists resq_cases_geo_idx
  on public.resq_cases
  using gist (geography(st_makepoint(lng, lat)))
  where lat is not null and lng is not null;
