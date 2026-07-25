-- Global app settings (single row), admin-editable
create table public.app_settings (
  id boolean primary key default true,
  markup_percent numeric not null default 15,
  updated_at timestamptz not null default now(),
  constraint single_row check (id)
);

insert into public.app_settings (id, markup_percent) values (true, 15);

alter table public.app_settings enable row level security;

create policy "Settings are viewable by everyone"
  on public.app_settings for select
  using (true);

create policy "Only admins can update settings"
  on public.app_settings for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Track imported products
alter table public.products add column if not exists source text;
alter table public.products add column if not exists base_price_cents integer;
