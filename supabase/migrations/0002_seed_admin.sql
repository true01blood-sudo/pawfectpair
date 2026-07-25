-- Create the admin account directly (auth signup was rate-limited) and promote it.
do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'admin@pawfectpair.app') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
      'admin@pawfectpair.app', crypt('SchimbaTupaRola1010', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Admin"}', false,
      '', '', '', ''
    );
  end if;
end $$;

update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@pawfectpair.app');
