-- 0046_in_app_notifications.sql
-- Tabel notificări in-app (UI web/mobile)

create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  type       text        not null default 'info'
             check (type in ('appointment','vaccine','adoption','event','social','system','info')),
  title      text        not null,
  body       text        not null,
  link       text,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users see own notifications" on public.notifications;
create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notifications_user_idx
  on public.notifications (user_id, is_read, created_at desc);

-- Realtime pentru badge live
alter publication supabase_realtime add table public.notifications;
