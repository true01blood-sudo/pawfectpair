-- ============================================================
-- 0029_petevents.sql — Modulul PetEvents (aplicația MOBILĂ)
--   * pet_events: evenimente pet (meetup, adopție, competiții, workshop,
--     expo, caritabil) publicate de membrii comunității
--   * event_participants: RSVP (going / maybe / cancelled), unic per (event, user)
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0028
-- ============================================================

-- 1) Evenimente
create table if not exists public.pet_events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'meetup'
    check (event_type in ('meetup', 'adoption', 'competition', 'training', 'expo', 'charity', 'other')),
  audience text not null default 'all' check (audience in ('all', 'dogs', 'cats', 'small_pets')),
  city text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_participants integer check (max_participants is null or max_participants between 2 and 5000),
  photo_url text,
  contact_phone text,
  status text not null default 'published' check (status in ('published', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pet_events enable row level security;

-- Toată lumea vede evenimentele publicate; organizatorul își vede și cele anulate.
drop policy if exists "Published pet events are public" on public.pet_events;
create policy "Published pet events are public"
  on public.pet_events for select
  using (status = 'published' or auth.uid() = organizer_id);

drop policy if exists "Organizers manage their pet events" on public.pet_events;
create policy "Organizers manage their pet events"
  on public.pet_events for all
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- Indexuri
create index if not exists pet_events_public_list_idx
  on public.pet_events (status, starts_at);
create index if not exists pet_events_city_idx
  on public.pet_events (city);
create index if not exists pet_events_type_idx
  on public.pet_events (event_type);
create index if not exists pet_events_organizer_idx
  on public.pet_events (organizer_id);

-- 2) Participanți (RSVP)
create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.pet_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_participants enable row level security;

-- Participanții unui eveniment public sunt vizibili public (contor + listă RSVP).
drop policy if exists "Event participants are public" on public.event_participants;
create policy "Event participants are public"
  on public.event_participants for select
  using (
    exists (
      select 1 from public.pet_events e
      where e.id = event_id
        and (e.status = 'published' or auth.uid() = e.organizer_id)
    )
  );

drop policy if exists "Users manage their own RSVP" on public.event_participants;
create policy "Users manage their own RSVP"
  on public.event_participants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists event_participants_event_idx
  on public.event_participants (event_id, status);
create index if not exists event_participants_user_idx
  on public.event_participants (user_id);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pet_events_title_len'
  ) then
    alter table public.pet_events
      add constraint pet_events_title_len
      check (char_length(trim(title)) between 3 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_events_city_len'
  ) then
    alter table public.pet_events
      add constraint pet_events_city_len
      check (char_length(trim(city)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_events_desc_len'
  ) then
    alter table public.pet_events
      add constraint pet_events_desc_len
      check (description is null or char_length(description) <= 1000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_events_period_valid'
  ) then
    alter table public.pet_events
      add constraint pet_events_period_valid
      check (ends_at > starts_at);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pet_events_duration_max'
  ) then
    alter table public.pet_events
      add constraint pet_events_duration_max
      check (ends_at <= starts_at + interval '14 days');
  end if;
end $$;

-- 4) Realtime (evenimente noi apar live în feed)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'pet_events'
  ) then
    alter publication supabase_realtime add table public.pet_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'event_participants'
  ) then
    alter publication supabase_realtime add table public.event_participants;
  end if;
end $$;

comment on table public.pet_events is
  'PetEvents: evenimente pet (meetup/adoption/competition/training/expo/charity) publicate de membri';
comment on table public.event_participants is
  'PetEvents: RSVP participanti (going/maybe/cancelled), unic per (event_id, user_id)';
