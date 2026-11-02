-- ──────────────────────────────────────────
-- 0063: Repara policy-urile de UPDATE la vet_appointments si
-- trainer_bookings — gasite in audit-ul de securitate de azi.
--
-- Problema: politica de UPDATE avea doar `using (owner = auth.uid() OR
-- trainer/vet = auth.uid())`, fara nicio restrictie pe `status`. Fara
-- `with check`, Postgres refoloseste `using` pentru randul nou — ceea
-- ce blocheaza reatribuirea catre alt owner/trainer, dar NU restrictioneaza
-- ce valoare de `status` poate seta fiecare parte. Rezultat: clientul
-- (owner_id) putea sa-si auto-confirme propria programare/rezervare
-- (status = 'confirmed'/'completed'), ocolind complet pasul de aprobare
-- al veterinarului/trainerului.
--
-- Fix: inlocuim politica unica de UPDATE cu doua politici separate —
-- owner-ul poate doar sa anuleze (status = 'cancelled'), iar
-- vet/trainer poate confirma/respinge/finaliza/anula. Postgres combina
-- politicile permisive pe acelasi comand cu OR, deci fiecare parte
-- trebuie sa satisfaca integral USING + WITH CHECK din propria politica.
-- ──────────────────────────────────────────

-- vet_appointments ---------------------------------------------------

drop policy if exists "Owners and vets update relevant appointments" on public.vet_appointments;

drop policy if exists "Owners cancel their own appointments" on public.vet_appointments;
create policy "Owners cancel their own appointments"
  on public.vet_appointments for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status = 'cancelled');

drop policy if exists "Vets manage appointment status" on public.vet_appointments;
create policy "Vets manage appointment status"
  on public.vet_appointments for update
  using (auth.uid() = (select user_id from public.vets where id = vet_id))
  with check (
    auth.uid() = (select user_id from public.vets where id = vet_id)
    and status in ('confirmed', 'cancelled', 'completed')
  );

-- trainer_bookings -----------------------------------------------------

drop policy if exists "Owners and trainers update relevant bookings" on public.trainer_bookings;

drop policy if exists "Owners cancel their own bookings" on public.trainer_bookings;
create policy "Owners cancel their own bookings"
  on public.trainer_bookings for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status = 'cancelled');

drop policy if exists "Trainers manage booking status" on public.trainer_bookings;
create policy "Trainers manage booking status"
  on public.trainer_bookings for update
  using (auth.uid() = (select user_id from public.edu_trainers where id = trainer_id))
  with check (
    auth.uid() = (select user_id from public.edu_trainers where id = trainer_id)
    and status in ('confirmed', 'declined', 'cancelled', 'completed')
  );
