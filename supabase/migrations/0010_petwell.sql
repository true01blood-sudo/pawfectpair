-- PetWell: digital medical record + weight tracking per pet

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('vaccination', 'treatment', 'surgery', 'checkup', 'allergy', 'other')),
  title text not null,
  record_date date not null default current_date,
  next_due_date date,
  notes text,
  attachment_url text,
  created_at timestamptz not null default now()
);

alter table public.medical_records enable row level security;

create policy "Owners manage their pets' medical records"
  on public.medical_records for all
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  weight_kg numeric not null check (weight_kg > 0),
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.weight_logs enable row level security;

create policy "Owners manage their pets' weight logs"
  on public.weight_logs for all
  using (auth.uid() = (select owner_id from public.pets where id = pet_id))
  with check (auth.uid() = (select owner_id from public.pets where id = pet_id));
