-- ──────────────────────────────────────────
-- 0053: breeding_listings (0042) a fost creată după 0019_admin_full_access,
-- deci nu avea politica standard de admin. Fără ea, admin nu poate nici
-- vedea anunțurile ne-active (SELECT e limitat la status='active' pentru
-- public), nici modera/șterge anunțul altcuiva.
-- ──────────────────────────────────────────

drop policy if exists "Admins manage all rows" on public.breeding_listings;
create policy "Admins manage all rows"
  on public.breeding_listings for all
  using (public.is_admin())
  with check (public.is_admin());
