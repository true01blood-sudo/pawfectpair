-- ──────────────────────────────────────────
-- 0058: Audit de securitate — fix-uri găsite
--
-- 1) profiles.phone era expus public: politica "Profiles are viewable by
--    everyone" (0001) e `using (true)`, necesară pentru full_name/avatar_url
--    (afișate peste tot — recenzii, postări forum, organizatori evenimente
--    etc.), dar aceeași politică expunea și `phone` (PII) oricui lovește
--    direct REST API-ul Supabase cu cheia anon publică (ocolind complet
--    aplicația web, care nu selectează niciodată phone din alt profil
--    decât al userului curent). RLS nu poate restricționa coloane per-rând
--    într-o singură politică — fix corect: revoke pe coloană + citire doar
--    prin funcție SECURITY DEFINER scoped la auth.uid().
-- ──────────────────────────────────────────

revoke select (phone) on public.profiles from anon, authenticated;

create or replace function public.get_my_phone()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select phone from public.profiles where id = auth.uid();
$$;

-- 2) contact_messages nu avea nicio constrângere de lungime — politica
--    INSERT e `with check (true)` (intenționat: formular public de
--    contact), dar fără limite, oricine poate scrie direct pe REST API
--    rânduri de dimensiune nelimitată, ocolind validarea din server
--    action-ul Next.js (care limitează la 120/200/200/2000 caractere).
--    Adăugăm aceleași limite ca barieră la nivel de DB.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_name_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_name_len
      check (char_length(trim(name)) between 1 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_email_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_email_len
      check (char_length(email) between 3 and 200 and email like '%@%');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_subject_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_subject_len
      check (subject is null or char_length(subject) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_message_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_message_len
      check (char_length(trim(message)) between 1 and 2000);
  end if;
end $$;

-- 3) Bucket-ul storage "public-media" (0001) nu are file_size_limit nici
--    allowed_mime_types — orice user autentificat putea urca orice tip de
--    fișier, de orice dimensiune (ImageUpload.tsx impune doar accept=
--    "image/*" în UI, trivial de ocolit printr-un apel direct la API).
--    Aplicăm aceleași limite pe care mobilul le are deja client-side
--    (packages/shared/src/constants/pet.ts: 5MB, jpeg/png/webp/heic),
--    de data asta impuse server-side de Storage API, nu doar UI.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'public-media';

-- 4) contact_messages nu avea nicio politică UPDATE/DELETE — admin putea
--    citi mesajele (politica existentă din 0037) dar nu le putea marca ca
--    citite sau șterge spam-ul. Adăugăm acces complet pentru admin.
drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages"
  on public.contact_messages for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5) pets: SELECT e `using (true)` din 0001 — necesar pentru cazuri reale
--    cross-user (veterinarii văd numele/specia animalului la o programare,
--    ResQ/adopții arată poze public etc.), deci nu putem restricționa
--    rândul întreg. Dar aceeași politică expunea și coloanele private:
--    `notes` (note libere ale proprietarului) și mai grav,
--    `emergency_contact_name`/`emergency_contact_phone` (0013/0025 —
--    numărul de telefon al unui CONTACT DE URGENȚĂ, PII reală a unei terțe
--    persoane) — oricui lovește REST API-ul direct, pentru orice pet_id.
--    Aplicația însăși nu le cere niciodată decât pentru propriile animale
--    (sos/page.tsx, animale/[id]/page.tsx — ambele eq(owner_id, user.id)),
--    deci restricția nu rupe nimic funcțional.
revoke select (notes, emergency_contact_name, emergency_contact_phone)
  on public.pets from anon, authenticated;

create or replace function public.get_my_pets_private_fields()
returns table (
  pet_id uuid,
  notes text,
  emergency_contact_name text,
  emergency_contact_phone text
)
language sql
security definer
set search_path = public
stable
as $$
  select id, notes, emergency_contact_name, emergency_contact_phone
  from public.pets
  where owner_id = auth.uid();
$$;
