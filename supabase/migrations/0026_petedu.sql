-- ============================================================
-- 0026_petedu.sql — Modul PetEdu (aplicația MOBILĂ)
--   * edu_articles: există în upstream 0011; recreat idempotent pentru
--     medii noi + RLS re-confirmat (toți citesc, doar adminii scriu)
--   * edu_trainers: NOU — director de traineri/instructori de animale
--     (profil public, specializări, oraș, experiență, telefon)
--   * seed articole RO (idempotent, din upstream 0012/0017 + extra)
-- ============================================================

-- 1) Articole educaționale (compatibil 0011)
create table if not exists public.edu_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  species text not null default 'general' check (species in ('general', 'caine', 'pisica', 'altele')),
  category text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.edu_articles enable row level security;

drop policy if exists "Articles are viewable by everyone" on public.edu_articles;
create policy "Articles are viewable by everyone"
  on public.edu_articles for select
  using (true);

drop policy if exists "Only admins manage articles" on public.edu_articles;
create policy "Only admins manage articles"
  on public.edu_articles for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create index if not exists edu_articles_species_idx
  on public.edu_articles (species, created_at desc);

-- 2) Traineri / instructori de animale (NOU)
create table if not exists public.edu_trainers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  specialties text[] not null default '{}',
  city text,
  bio text,
  experience_years integer not null default 0 check (experience_years between 0 and 60),
  phone text,
  price_range text,
  photo_url text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- un singur profil trainer per utilizator
create unique index if not exists edu_trainers_user_id_key
  on public.edu_trainers (user_id);

alter table public.edu_trainers enable row level security;

-- Toată lumea vede profilurile ACTIVE; ownerul își vede și profilul inactiv;
-- adminii văd tot.
drop policy if exists "Active trainer profiles are public" on public.edu_trainers;
create policy "Active trainer profiles are public"
  on public.edu_trainers for select
  using (
    active = true
    or auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

drop policy if exists "Trainers manage their own profile" on public.edu_trainers;
create policy "Trainers manage their own profile"
  on public.edu_trainers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage all trainer profiles" on public.edu_trainers;
create policy "Admins manage all trainer profiles"
  on public.edu_trainers for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Indexuri: căutare pe specializări (array), oraș, listare publică
create index if not exists edu_trainers_specialties_idx
  on public.edu_trainers using gin (specialties);
create index if not exists edu_trainers_city_idx
  on public.edu_trainers (city);
create index if not exists edu_trainers_public_list_idx
  on public.edu_trainers (verified, active, created_at desc);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'edu_trainers_display_name_len'
  ) then
    alter table public.edu_trainers
      add constraint edu_trainers_display_name_len
      check (char_length(trim(display_name)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'edu_trainers_bio_len'
  ) then
    alter table public.edu_trainers
      add constraint edu_trainers_bio_len
      check (bio is null or char_length(bio) <= 600);
  end if;
end $$;

-- 4) Realtime pe traineri (listă live)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'edu_trainers'
  ) then
    alter publication supabase_realtime add table public.edu_trainers;
  end if;
end $$;

-- 5) Seed articole RO (idempotent — nu duplichează după titlu)
insert into public.edu_articles (title, body, species, category, created_by)
select v.title, v.body, v.species, v.category, p.id
from (values
  ('Comanda de bază „Șezi"', 'Ține o recompensă lângă nasul câinelui, ridic-o încet deasupra capului — capul urmărește mâna și fundul coboară. Spune „Șezi" exact în momentul așezării, recompensează imediat. Repetă 5 minute/zi, 3 zile la rând.', 'caine', 'dresaj'),
  ('Comanda „Vino" cu recompensă', 'Începe într-un spațiu fără distrageri, la 2-3 metri distanță. Spune numele + „Vino" cu voce veselă, recompensează imediat la sosire. Nu chema niciodată câinele pentru a-l certa — asociază comanda doar cu lucruri plăcute.', 'caine', 'dresaj'),
  ('Cum oprești mușcatul la pui de câine', 'Puii mușcă din joacă — scoate un sunet ascuțit „au!" și oprește jocul 10-20 secunde. Oferă o jucărie potrivită pentru mușcat imediat după. Consistența e cheia: toți membrii familiei trebuie să reacționeze la fel.', 'caine', 'dresaj'),
  ('Folosirea litierei — pași corecți', 'Pentru pisici sau pui noi: pune-i lăbuțele ușor în litieră după masă și după somn, fără forțare. Curăță zilnic — pisicile evită litiera murdară. Dacă refuză brusc litiera folosită anterior, poate fi semn medical, nu comportamental.', 'pisica', 'dresaj'),
  ('Câte calorii are nevoie câinele tău', 'Formulă orientativă: 30 x greutate(kg) + 70 = necesar caloric zilnic pentru un câine adult, moderat activ. Câinii sterilizați au nevoie cu ~20% mai puțin. Ajustează în funcție de condiția fizică, nu doar de vârstă.', 'caine', 'alimentație'),
  ('Alimente periculoase pentru câini și pisici', 'De evitat strict: ciocolată, struguri/stafide, ceapă, usturoi, xilitol (îndulcitor), avocado, alcool, cofeină. Chiar și cantități mici pot fi toxice — la ingestie accidentală, sună imediat veterinarul.', 'general', 'alimentație'),
  ('Trecerea la altă hrană — fără deranj digestiv', 'Amestecă treptat hrana nouă cu cea veche timp de 7-10 zile: 25% nouă/75% veche (zilele 1-3), 50/50 (zilele 4-6), 75/25 (zilele 7-9), 100% nouă din ziua 10. Schimbarea bruscă poate cauza diaree.', 'general', 'alimentație'),
  ('Exerciții zilnice de stimulare mentală', 'Ascunde bucăți de hrană prin casă pentru „vânătoare de comori", folosește jucării puzzle cu recompense, sau alternează traseul de plimbare. 15 minute de stimulare mentală obosesc la fel de mult ca 1 oră de alergat.', 'general', 'exerciții'),
  ('Cât de des trebuie hrănit un cățel?', 'Pui de câine (2-6 luni): 3-4 mese/zi. Câini adulți: 1-2 mese/zi, la ore fixe. Evită să lași hrana la dispoziție tot timpul (risc de supraalimentare).', 'caine', 'nutriție'),
  ('Semnele unei pisici stresate', 'Ascundere prelungită, lipsă poftă de mâncare, urinare în afara litierei, lins excesiv. Dacă persistă mai mult de 2 zile, consultă un veterinar.', 'pisica', 'comportament'),
  ('Vaccinuri obligatorii primul an', 'Cele mai frecvente: rabie, parvoviroză, hepatită infecțioasă, leptospiroză (câini); tripla felină + rabie (pisici). Programează prima vizită la 6-8 săptămâni.', 'general', 'sănătate'),
  ('Cum introduci un animal nou în casă', 'Alocă-i un spațiu propriu primele zile, păstrează rutina de hrănire constantă și lasă-l să exploreze în ritmul lui. Evită prezentarea bruscă altor animale din casă.', 'general', 'adopție'),
  ('Anxietatea de separare — primele semnale', 'Distrugerea ușii/geamului când ești plecat, urlături la plecare, salivare excesivă. Începe cu plecări scurte (1-2 minute), nu fă din plecare/venire un eveniment emoțional mare. Pentru cazuri severe, colaborează cu un behaviorist.', 'general', 'comportament'),
  ('Mersul în lesă fără tracțiune', 'Oprește-te ori de câte ori lesa se întinde. Reluă mergând doar când câinele relaxează tensiunea. Recompensează poziția lângă picior, nu în față. 10 minute de „lesă moale" zilnic valorează mai mult decât o plimbare lungă cu tracțiune.', 'caine', 'dresaj')
) as v(title, body, species, category)
cross join lateral (
  select id from public.profiles where role = 'admin' limit 1
) as p
where not exists (select 1 from public.edu_articles where title = v.title);
