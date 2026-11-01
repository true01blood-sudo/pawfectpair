-- ──────────────────────────────────────────
-- 0057: pet_events / event_participants (0029) nu aveau nicio politică
-- de admin (0029 e ulterioară lui 0019_admin_full_access). Admin nu putea
-- vedea evenimentele anulate ale altor useri și nu putea modera
-- (anula/șterge) evenimentul nimănui în afară de al său.
-- ──────────────────────────────────────────

drop policy if exists "Admins manage all pet events" on public.pet_events;
create policy "Admins manage all pet events"
  on public.pet_events for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage all event participants" on public.event_participants;
create policy "Admins manage all event participants"
  on public.event_participants for all
  using (public.is_admin())
  with check (public.is_admin());
