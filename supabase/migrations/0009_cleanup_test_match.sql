-- Remove the test fixture used to validate the PetMatch trigger.
delete from auth.users where email = 'test-match@pawfectpair.app';
delete from public.pets where name = 'Bella (test)';
