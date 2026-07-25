create table public.resq_cases (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  type text not null check (type in ('lost', 'found')),
  name text not null,
  species text not null,
  description text,
  city text,
  last_seen_location text,
  contact_phone text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.resq_cases enable row level security;

create policy "ResQ cases are viewable by everyone"
  on public.resq_cases for select
  using (true);

create policy "Reporters manage their own ResQ cases"
  on public.resq_cases for all
  using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id);
