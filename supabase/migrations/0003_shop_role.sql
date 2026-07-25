alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'vet', 'shelter', 'shop', 'admin'));
