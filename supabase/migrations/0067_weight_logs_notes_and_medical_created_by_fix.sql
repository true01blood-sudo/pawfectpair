-- ──────────────────────────────────────────
-- 0067: Doua bug-uri gasite la testarea noului build (dupa 0066).
--
-- 1) weight_logs nu a avut NICIODATA o coloana `notes`, desi
--    WeightLogSchema (Zod), interfata WeightLog/WeightLogInput si
--    addWeightLog() din mobil trimit mereu `notes` la insert.
--    Eroare: "could not find the notes column of weight_logs in the
--    schema cache". Adaugam coloana ca sa corespunda cu tot codul
--    existent (nu invers — 11 fisiere asteapta `notes`).
--
-- 2) medical_records.created_by e NOT NULL, dar createMedicalRecord()
--    din mobil (lib/supabase/queries.ts) nu a trimis NICIODATA acest
--    camp — MedicalRecordInput (shared) nu-l are deloc in tip. Eroare:
--    "null value in column created_by ... violates not-null
--    constraint". Fix-ul e in cod (queries.ts + useMedical.ts), nu in
--    schema — created_by ramane obligatoriu (e corect sa stim cine a
--    adaugat inregistrarea).
-- ──────────────────────────────────────────

alter table public.weight_logs
  add column if not exists notes text check (notes is null or char_length(notes) <= 500);
