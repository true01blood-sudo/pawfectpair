-- Populate empty sections with one visible example each, so the platform
-- doesn't look abandoned before real users/partners join.
do $$
declare
  admin_id uuid;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;
  if admin_id is null then
    return;
  end if;

  if not exists (select 1 from public.adoption_listings) then
    insert into public.adoption_listings
      (posted_by, name, species, breed, age_years, sex, size, description, city, status)
    values (
      admin_id, 'Luna', 'Câine', 'Metis', 1.5, 'female', 'medium',
      'Luna este blândă, sociabilă și se înțelege bine cu alte animale. Vaccinată și sterilizată.',
      'București', 'available'
    );
  end if;
end $$;
