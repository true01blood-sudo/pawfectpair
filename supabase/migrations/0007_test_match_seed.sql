-- Temporary test fixture to validate the mutual-match trigger end-to-end.
do $$
declare
  test_user_id uuid := gen_random_uuid();
  admin_id uuid;
  admin_pet_id uuid;
  test_pet_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'test-match@pawfectpair.app') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', test_user_id, 'authenticated', 'authenticated',
      'test-match@pawfectpair.app', crypt('TestMatch123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Test Match"}', false,
      '', '', '', ''
    );
  else
    select id into test_user_id from auth.users where email = 'test-match@pawfectpair.app';
  end if;

  insert into public.pets (id, owner_id, name, species)
  values (test_pet_id, test_user_id, 'Bella (test)', 'Câine')
  on conflict do nothing;

  select id into admin_id from auth.users where email = 'admin@pawfectpair.app';
  select id into admin_pet_id from public.pets where owner_id = admin_id limit 1;

  if admin_pet_id is not null then
    insert into public.pet_likes (from_pet_id, to_pet_id, from_user_id, liked)
    values (admin_pet_id, test_pet_id, admin_id, true)
    on conflict do nothing;

    insert into public.pet_likes (from_pet_id, to_pet_id, from_user_id, liked)
    values (test_pet_id, admin_pet_id, test_user_id, true)
    on conflict do nothing;
  end if;
end $$;
