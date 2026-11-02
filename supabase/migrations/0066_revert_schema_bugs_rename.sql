-- ──────────────────────────────────────────
-- 0066: Revine asupra redenumirilor din 0047_fix_schema_bugs.sql.
--
-- 0047 a redenumit:
--   medical_records.next_due_date -> due_date
--   weight_logs.logged_at         -> measured_at
-- dar NICIUN cod din aplicatie (mobil, web, @pawfectpair/shared —
-- tipuri TS, scheme Zod MedicalRecordSchema/WeightLogSchema, toate
-- query-urile) n-a fost actualizat vreodata sa foloseasca noile nume.
-- Rezultat: Postgrest raporta "could not find the next_due_date column
-- of medical_records in the schema cache" / idem pentru logged_at —
-- coloanele chiar nu mai existau sub numele asteptat de cod, de cand a
-- rulat 0047. Adaugarea unei inregistrari medicale cu scadenta si
-- cantarirea animalului erau complet rupte.
--
-- next_due_date/logged_at sunt folosite real in 29 de fisiere din
-- cod (tipuri, scheme de validare, query-uri mobil si web); due_date/
-- measured_at apar doar in 2 fisiere de test, ele insele inconsistente
-- cu schema Zod reala — confirma ca 0047 a fost schimbarea gresita,
-- nu invers. Revenim la numele originale, cu acelasi tipar idempotent
-- "if exists" ca sa fie sigur de rulat indiferent de starea curenta.
-- ──────────────────────────────────────────

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medical_records'
      and column_name = 'due_date'
  ) then
    alter table public.medical_records rename column due_date to next_due_date;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'weight_logs'
      and column_name = 'measured_at'
  ) then
    alter table public.weight_logs rename column measured_at to logged_at;
  end if;
end;
$$;

-- Fortam PostgREST sa-si reincarce cache-ul de schema imediat, in loc
-- sa astepte urmatoarea reincarcare automata.
notify pgrst, 'reload schema';
