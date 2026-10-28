create table if not exists contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  created_at  timestamptz default now()
);

-- Only admins can read contact messages
alter table contact_messages enable row level security;

create policy "Admins can read contact messages"
  on contact_messages for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Anyone can insert (public contact form)
create policy "Anyone can submit contact message"
  on contact_messages for insert
  with check (true);
