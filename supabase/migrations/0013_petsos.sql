alter table public.pets add column if not exists emergency_contact_name text;
alter table public.pets add column if not exists emergency_contact_phone text;

create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('medical', 'lost', 'danger')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sos_events enable row level security;

create policy "Owners manage their own SOS events"
  on public.sos_events for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
