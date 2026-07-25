-- PawfectPair initial schema
-- Modules covered: profiles/auth, pets, adoptions, vets/appointments, marketplace, community forum

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'vet', 'shelter', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Auto-create profile row when a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PETS (owned by users)
-- ============================================================
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  birth_date date,
  sex text check (sex in ('male', 'female', 'unknown')),
  weight_kg numeric,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pets enable row level security;

create policy "Owners manage their own pets"
  on public.pets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Pets are viewable by everyone"
  on public.pets for select
  using (true);

-- ============================================================
-- ADOPTIONS
-- ============================================================
create table public.adoption_listings (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  age_years numeric,
  sex text check (sex in ('male', 'female', 'unknown')),
  size text check (size in ('small', 'medium', 'large')),
  description text,
  city text,
  photo_url text,
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.adoption_listings enable row level security;

create policy "Adoption listings are viewable by everyone"
  on public.adoption_listings for select
  using (true);

create policy "Posters manage their own listings"
  on public.adoption_listings for all
  using (auth.uid() = posted_by)
  with check (auth.uid() = posted_by);

create table public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

alter table public.adoption_applications enable row level security;

create policy "Applicants view their own applications"
  on public.adoption_applications for select
  using (
    auth.uid() = applicant_id
    or auth.uid() = (select posted_by from public.adoption_listings where id = listing_id)
  );

create policy "Users can apply to listings"
  on public.adoption_applications for insert
  with check (auth.uid() = applicant_id);

create policy "Applicants can withdraw, posters can decide"
  on public.adoption_applications for update
  using (
    auth.uid() = applicant_id
    or auth.uid() = (select posted_by from public.adoption_listings where id = listing_id)
  );

-- ============================================================
-- VETS & APPOINTMENTS
-- ============================================================
create table public.vets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  clinic_name text not null,
  city text,
  address text,
  phone text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.vets enable row level security;

create policy "Vets are viewable by everyone"
  on public.vets for select
  using (true);

create policy "Vet owners manage their clinic profile"
  on public.vets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.vet_appointments (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references public.vets (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  reason text,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.vet_appointments enable row level security;

create policy "Owners and vets view relevant appointments"
  on public.vet_appointments for select
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.vets where id = vet_id)
  );

create policy "Owners create appointments for their pets"
  on public.vet_appointments for insert
  with check (
    auth.uid() = owner_id
    and auth.uid() = (select owner_id from public.pets where id = pet_id)
  );

create policy "Owners and vets update relevant appointments"
  on public.vet_appointments for update
  using (
    auth.uid() = owner_id
    or auth.uid() = (select user_id from public.vets where id = vet_id)
  );

-- ============================================================
-- MARKETPLACE
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles (id) on delete set null,
  name text not null,
  description text,
  category text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'RON',
  stock integer not null default 0 check (stock >= 0),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy "Sellers manage their own products"
  on public.products for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  total_cents integer not null default 0,
  currency text not null default 'RON',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Buyers view and manage their own orders"
  on public.orders for all
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null
);

alter table public.order_items enable row level security;

create policy "Buyers view their own order items"
  on public.order_items for select
  using (auth.uid() = (select buyer_id from public.orders where id = order_id));

create policy "Buyers insert items into their own orders"
  on public.order_items for insert
  with check (auth.uid() = (select buyer_id from public.orders where id = order_id));

-- ============================================================
-- COMMUNITY / FORUM
-- ============================================================
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

create policy "Forum posts are viewable by everyone"
  on public.forum_posts for select
  using (true);

create policy "Authors manage their own posts"
  on public.forum_posts for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.forum_comments enable row level security;

create policy "Forum comments are viewable by everyone"
  on public.forum_comments for select
  using (true);

create policy "Authors manage their own comments"
  on public.forum_comments for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- ============================================================
-- STORAGE (pet photos, product photos, avatars)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

create policy "Public media is readable by everyone"
  on storage.objects for select
  using (bucket_id = 'public-media');

create policy "Authenticated users can upload public media"
  on storage.objects for insert
  with check (bucket_id = 'public-media' and auth.role() = 'authenticated');

create policy "Users manage their own uploaded media"
  on storage.objects for update
  using (bucket_id = 'public-media' and auth.uid() = owner);

create policy "Users delete their own uploaded media"
  on storage.objects for delete
  using (bucket_id = 'public-media' and auth.uid() = owner);
