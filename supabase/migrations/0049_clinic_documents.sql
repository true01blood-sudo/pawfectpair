-- ──────────────────────────────────────────
-- 0049: Clinic documents — dovezi de calificare încărcate de cabinete
-- (diplomă, certificare, autorizație) pentru verificarea profilului.
-- Fără flux de aprobare admin încă — status rămâne 'pending' până
-- la o migrare viitoare care adaugă revizuirea.
-- ──────────────────────────────────────────

create table if not exists public.clinic_documents (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references public.vets (id) on delete cascade,
  title text not null,
  file_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.clinic_documents enable row level security;

drop policy if exists "Vet owners manage their clinic documents" on public.clinic_documents;
create policy "Vet owners manage their clinic documents"
  on public.clinic_documents for all
  using (auth.uid() = (select user_id from public.vets where id = vet_id))
  with check (auth.uid() = (select user_id from public.vets where id = vet_id));

create index if not exists clinic_documents_vet_idx
  on public.clinic_documents (vet_id, created_at desc);
