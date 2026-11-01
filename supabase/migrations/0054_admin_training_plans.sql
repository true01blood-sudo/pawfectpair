-- ──────────────────────────────────────────
-- 0054: training_plans (0041) are doar SELECT (is_active=true) pentru
-- public și o politică FOR ALL scoasă la ownerul trainerului (profile_id).
-- Admin nu avea nicio politică proprie, deci nu putea vedea planurile
-- inactive și nu putea modera (dezactivare/ștergere) planul altui trainer.
-- trainers are deja "Admins can manage trainers" din 0041 — nu necesită
-- politică nouă.
-- ──────────────────────────────────────────

drop policy if exists "Admins manage all training plans" on public.training_plans;
create policy "Admins manage all training plans"
  on public.training_plans for all
  using (public.is_admin())
  with check (public.is_admin());
