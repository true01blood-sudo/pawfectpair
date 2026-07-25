-- PetPlanner: recurring/one-off activity reminders per pet
create table public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null default 'other' check (category in ('feeding', 'walk', 'grooming', 'medication', 'other')),
  due_at timestamptz not null,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.planner_tasks enable row level security;

create policy "Owners manage their own planner tasks"
  on public.planner_tasks for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- PetEdu: curated tips/articles, managed by admins, readable by everyone
create table public.edu_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  species text not null default 'general' check (species in ('general', 'caine', 'pisica', 'altele')),
  category text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.edu_articles enable row level security;

create policy "Articles are viewable by everyone"
  on public.edu_articles for select
  using (true);

create policy "Only admins manage articles"
  on public.edu_articles for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
