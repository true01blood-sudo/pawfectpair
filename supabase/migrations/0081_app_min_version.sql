-- ──────────────────────────────────────────
-- 0081: versiune minima obligatorie pentru aplicatia mobila
--
-- app_settings e deja un singleton citibil de oricine (anon inclus,
-- vezi 0004_settings_and_import.sql) — perfect pentru un check la
-- deschiderea aplicatiei, inainte de orice autentificare.
--
-- min_app_version e NULL by default = gate inactiv (nimeni nu e
-- blocat). Un admin il seteaza din /admin/setari cand vrea sa forteze
-- update la o versiune noua; mobilul compara Constants.expoConfig.version
-- cu aceasta valoare (semver simplu) si blocheaza ecranul daca e mai mica.
-- ──────────────────────────────────────────

alter table public.app_settings
  add column if not exists min_app_version text,
  add column if not exists update_message text,
  add column if not exists ios_store_url text,
  add column if not exists android_store_url text;
