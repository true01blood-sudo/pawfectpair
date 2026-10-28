-- ──────────────────────────────────────────
-- 0048: Dedupe trainers — elimină rândurile duplicate din seed-ul 0041
--
-- Cauza: INSERT INTO trainers ... ON CONFLICT DO NOTHING se bazează pe
-- constrângerea UNIQUE de pe profile_id, dar toate rândurile seed au
-- profile_id = NULL. Postgres nu tratează NULL = NULL ca duplicat la
-- verificarea UNIQUE, deci rularea migrației 0041 de mai multe ori a
-- inserat fiecare antrenor seed de două ori.
--
-- Idempotent: dacă nu mai există duplicate, nu șterge nimic.
-- ──────────────────────────────────────────

with ranked as (
  select
    id,
    row_number() over (
      partition by display_name, coalesce(city, '')
      order by created_at asc, id asc
    ) as rn
  from public.trainers
  where profile_id is null
)
delete from public.trainers t
using ranked r
where t.id = r.id
  and r.rn > 1;
