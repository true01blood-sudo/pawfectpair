create table public.vet_reviews (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references public.vets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (vet_id, user_id)
);

alter table public.vet_reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.vet_reviews for select
  using (true);

create policy "Users manage their own review"
  on public.vet_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
