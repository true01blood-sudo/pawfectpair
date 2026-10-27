-- ============================================================
-- 0038_push_notifications.sql — Notificări push geo-localizate
--
-- Adaugă:
--   * extensia PostGIS (coordonate GPS)
--   * extensia pg_net (HTTP din trigger Postgres)
--   * push_tokens — token-uri Expo per user, cu locație + raza alertelor
--   * lat/lng pe resq_cases — coordonatele locului unde a fost văzut animalul
--   * get_tokens_in_radius — RPC folosit de Edge Function
--   * trigger on_resq_case_insert — apelează Edge Function la caz nou 'lost'
-- ============================================================

-- 1) Extensii
create extension if not exists postgis;
create extension if not exists pg_net schema extensions;

-- 2) Tabela push_tokens (spec §11.2, extinsă cu geo și raza alertelor)
create table if not exists public.push_tokens (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null references auth.users (id) on delete cascade,
  token                  text        not null,
  platform               text        not null check (platform in ('ios', 'android')),
  lat                    double precision,
  lng                    double precision,
  notification_radius_km int         not null default 10
                                     check (notification_radius_km between 1 and 100),
  updated_at             timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.push_tokens enable row level security;

drop policy if exists "Users manage own push tokens" on public.push_tokens;
create policy "Users manage own push tokens"
  on public.push_tokens for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index spațial — query rapid ST_DWithin
create index if not exists push_tokens_geo_idx
  on public.push_tokens
  using gist (geography(st_makepoint(lng, lat)))
  where lat is not null and lng is not null;

comment on table public.push_tokens is
  'Token-uri Expo Push per device; lat/lng = ultima locație, radius = raza alertelor dorite (km).';
comment on column public.push_tokens.notification_radius_km is
  'Raza în km în care userul acceptă alerte pierdut/găsit. Default 10 km, max 100 km.';

-- 3) Coordonate GPS pe resq_cases
alter table public.resq_cases
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists resq_cases_geo_idx
  on public.resq_cases
  using gist (geography(st_makepoint(lng, lat)))
  where lat is not null and lng is not null;

comment on column public.resq_cases.lat is
  'Latitudine GPS — locul unde a fost văzut ultima dată animalul.';
comment on column public.resq_cases.lng is
  'Longitudine GPS — locul unde a fost văzut ultima dată animalul.';

-- 4) RPC — returnează token-urile userilor din raza cazului
--    Apelat din Edge Function cu service_role (ocolește RLS).
create or replace function public.get_tokens_in_radius(
  case_lat double precision,
  case_lng double precision
)
returns table (token text, user_id uuid)
language sql
security definer
stable
as $$
  select pt.token, pt.user_id
  from   public.push_tokens pt
  where  pt.lat is not null
    and  pt.lng is not null
    and  st_dwithin(
           geography(st_makepoint(pt.lng, pt.lat)),
           geography(st_makepoint(case_lng, case_lat)),
           pt.notification_radius_km * 1000   -- km → metri
         );
$$;

comment on function public.get_tokens_in_radius is
  'Returnează token-urile Expo ale userilor ale căror coordonate se află în raza proprie față de punctul dat.';

-- 5) Trigger: la caz nou 'lost' cu coordonate → apelează Edge Function
--
--    Necesită setare prealabilă în Supabase SQL Editor (o singură dată):
--      alter database postgres
--        set "app.supabase_url"        = 'https://<project-ref>.supabase.co';
--      alter database postgres
--        set "app.service_role_key"    = '<service-role-key>';
--
--    ATENȚIE: service_role_key este confidențial — nu-l expune în cod client.
--    Alternativă fără trigger: apelează Edge Function direct din app după insert.

create or replace function public.fn_notify_resq_zone()
returns trigger
language plpgsql
security definer
as $$
declare
  _url  text := current_setting('app.supabase_url', true);
  _key  text := current_setting('app.service_role_key', true);
begin
  -- Nu trimite dacă nu avem coordonate sau URL-ul nu e configurat
  if new.type <> 'lost' then return new; end if;
  if new.lat is null or new.lng is null then return new; end if;
  if _url is null or _key is null then return new; end if;

  perform extensions.net.http_post(
    url     := _url || '/functions/v1/notify-resq-zone',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body    := jsonb_build_object(
      'case_id',       new.id,
      'name',          new.name,
      'species',       new.species,
      'city',          new.city,
      'lat',           new.lat,
      'lng',           new.lng,
      'photo_url',     new.photo_url,
      'contact_phone', new.contact_phone
    )::text
  );

  return new;
end;
$$;

drop trigger if exists on_resq_case_insert on public.resq_cases;
create trigger on_resq_case_insert
  after insert on public.resq_cases
  for each row
  execute function public.fn_notify_resq_zone();
