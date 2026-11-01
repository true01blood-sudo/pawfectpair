-- ──────────────────────────────────────────
-- 0061: Flow de rezervare pe pași (mockup 5.png: Pet → Time → Review) —
-- leagă o programare de un serviciu concret din vet_services, ca pasul
-- de recapitulare să poată arăta prețul corect (nu doar un "reason" liber).
-- ──────────────────────────────────────────

alter table public.vet_appointments
  add column if not exists service_id uuid references public.vet_services (id) on delete set null;
