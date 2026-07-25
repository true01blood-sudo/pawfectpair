-- Grant admins full read/write/delete override across all user-generated content,
-- so the admin panel can manage members, listings, products, etc. on their behalf.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: admins can update any profile (role changes, moderation), not just their own
create policy "Admins manage all profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (true);

create policy "Admins delete any profile"
  on public.profiles for delete
  using (public.is_admin());

do $$
declare
  t text;
  tables text[] := array[
    'pets', 'adoption_listings', 'adoption_applications', 'vets', 'vet_appointments',
    'products', 'orders', 'order_items', 'forum_posts', 'forum_comments',
    'resq_cases', 'planner_tasks', 'medical_records', 'weight_logs', 'sos_events',
    'vet_reviews'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy "Admins manage all rows" on public.%I for all using (public.is_admin()) with check (public.is_admin());',
      t
    );
  end loop;
end $$;
