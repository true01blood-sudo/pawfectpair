-- ──────────────────────────────────────────
-- 0055: circles (0041) nu avea nicio politică de admin — mai mult,
-- nu exista NICIO politică DELETE pentru circles (nici măcar ownerul nu
-- putea șterge un cerc creat de el), iar circle_events nu avea deloc
-- UPDATE/DELETE. Admin nu putea vedea cercurile private (is_public=false)
-- și nu putea modera (șterge) niciun cerc sau eveniment.
-- ──────────────────────────────────────────

drop policy if exists "Admins manage all circles" on public.circles;
create policy "Admins manage all circles"
  on public.circles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage all circle members" on public.circle_members;
create policy "Admins manage all circle members"
  on public.circle_members for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage all circle events" on public.circle_events;
create policy "Admins manage all circle events"
  on public.circle_events for all
  using (public.is_admin())
  with check (public.is_admin());
