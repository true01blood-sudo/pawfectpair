-- ──────────────────────────────────────────
-- 0052: clinic_documents (0049) a fost creată după 0019_admin_full_access
-- și nu a fost inclusă în lista de tabele cu acces admin. Adaugă aceeași
-- politică standard, reutilizând funcția deja existentă public.is_admin().
-- ──────────────────────────────────────────

drop policy if exists "Admins manage all rows" on public.clinic_documents;
create policy "Admins manage all rows"
  on public.clinic_documents for all
  using (public.is_admin())
  with check (public.is_admin());
