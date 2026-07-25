-- PetMatch: swipe-style compatibility matching between pets + private chat between owners

create table public.pet_likes (
  id uuid primary key default gen_random_uuid(),
  from_pet_id uuid not null references public.pets (id) on delete cascade,
  to_pet_id uuid not null references public.pets (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  liked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (from_pet_id, to_pet_id),
  check (from_pet_id <> to_pet_id)
);

alter table public.pet_likes enable row level security;

create policy "Users manage their own outgoing likes"
  on public.pet_likes for all
  using (auth.uid() = from_user_id)
  with check (auth.uid() = from_user_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  pet_a_id uuid not null references public.pets (id) on delete cascade,
  pet_b_id uuid not null references public.pets (id) on delete cascade,
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (pet_a_id, pet_b_id)
);

alter table public.matches enable row level security;

create policy "Users view their own matches"
  on public.matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Detect mutual likes and create a match automatically (runs with definer's
-- elevated rights so it can write to matches regardless of caller's RLS).
create function public.handle_pet_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  reciprocal boolean;
  pa uuid; pb uuid; ua uuid; ub uuid;
begin
  if new.liked then
    select exists(
      select 1 from public.pet_likes
      where from_pet_id = new.to_pet_id and to_pet_id = new.from_pet_id and liked = true
    ) into reciprocal;

    if reciprocal then
      if new.from_pet_id < new.to_pet_id then
        pa := new.from_pet_id; pb := new.to_pet_id;
      else
        pa := new.to_pet_id; pb := new.from_pet_id;
      end if;

      select owner_id into ua from public.pets where id = pa;
      select owner_id into ub from public.pets where id = pb;

      insert into public.matches (pet_a_id, pet_b_id, user_a_id, user_b_id)
      values (pa, pb, ua, ub)
      on conflict (pet_a_id, pet_b_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_pet_like_created
  after insert on public.pet_likes
  for each row execute procedure public.handle_pet_like();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Match participants can read messages"
  on public.messages for select
  using (
    auth.uid() in (
      select user_a_id from public.matches where id = match_id
      union
      select user_b_id from public.matches where id = match_id
    )
  );

create policy "Match participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select user_a_id from public.matches where id = match_id
      union
      select user_b_id from public.matches where id = match_id
    )
  );
