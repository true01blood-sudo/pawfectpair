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
-- Prima incercare a acestei migratii a esuat: presupusesem ca search_path
-- ('"$user", public, extensions', confirmat printr-o conexiune separata)
-- se aplica si in sesiunea in care ruleaza `supabase db push` — nu e
-- cazul, sesiunea aia nu are `extensions` in search_path, deci
-- st_makepoint/geography neprefixate n-au fost gasite (42883). A esuat
-- curat, intr-o singura tranzactie — nimic n-a ramas pe jumatate aplicat.
--
-- Fix: schema-calificat explicit peste tot (extensions.foo), ca in
-- indexuri si functie sa nu mai conteze care e search_path-ul sesiunii
-- ce le ruleaza/apeleaza.
--
-- Niciun column din proiect nu e de tip geometry/geography (doar lat/lng
-- ca double precision) — spatial_ref_sys se repopuleaza automat la
-- reinstalare (date standard EPSG, nu date proprii), deci nu exista
-- nicio pierdere de date posibila aici.
-- ──────────────────────────────────────────

drop extension if exists postgis cascade;
create extension if not exists postgis schema extensions;

create index if not exists push_tokens_geo_idx
  on public.push_tokens
  using gist (extensions.geography(extensions.st_makepoint(lng, lat)))
  where lat is not null and lng is not null;

create index if not exists resq_cases_geo_idx
  on public.resq_cases
  using gist (extensions.geography(extensions.st_makepoint(lng, lat)))
  where lat is not null and lng is not null;

-- Recreat cu acelasi comportament ca în 0038, doar cu referinte PostGIS
-- schema-calificate (nu mai depinde de search_path-ul apelantului —
-- RPC din Edge Function, apel direct din SQL editor, orice).
create or replace function public.get_tokens_in_radius(
  case_lat double precision,
  case_lng double precision
)
returns table (token text, user_id uuid)
language sql
security definer
stable
as $$
  select pt.token, pt.user_id
  from   public.push_tokens pt
  where  pt.lat is not null
    and  pt.lng is not null
    and  extensions.st_dwithin(
           extensions.geography(extensions.st_makepoint(pt.lng, pt.lat)),
           extensions.geography(extensions.st_makepoint(case_lng, case_lat)),
           pt.notification_radius_km * 1000   -- km → metri
         );
$$;
