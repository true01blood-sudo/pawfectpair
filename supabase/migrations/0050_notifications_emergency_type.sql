-- ──────────────────────────────────────────
-- 0050: Adaugă tipul 'emergency' la notifications — necesar pentru
-- broadcast-ul SOS către cabinete (vezi fix /sos — alerta nu ajungea
-- nicăieri, doar se scria silențios în sos_events).
-- ──────────────────────────────────────────

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('appointment','vaccine','adoption','event','social','system','info','emergency'));
