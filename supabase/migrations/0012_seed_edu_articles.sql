insert into public.edu_articles (title, body, species, category, created_by)
select v.title, v.body, v.species, v.category, p.id
from (values
  ('Cât de des trebuie hrănit un cățel?', 'Pui de câine (2-6 luni): 3-4 mese/zi. Câini adulți: 1-2 mese/zi, la ore fixe. Evită să lași hrana la dispoziție tot timpul (risc de supraalimentare).', 'caine', 'nutriție'),
  ('Semnele unei pisici stresate', 'Ascundere prelungită, lipsă poftă de mâncare, urinare în afara litierei, lins excesiv. Dacă persistă >2 zile, consultă un veterinar.', 'pisica', 'comportament'),
  ('Vaccinuri obligatorii primul an', 'Cele mai frecvente: rabie, parvoviroză, hepatită infecțioasă, leptospiroză (câini); tripla felină + rabie (pisici). Programează prima vizită la 6-8 săptămâni.', 'general', 'sănătate'),
  ('Cum introduci un animal nou în casă', 'Alocă-i un spațiu propriu primele zile, păstrează rutina de hrănire constantă și lasă-l să exploreze în ritmul lui. Evită prezentarea bruscă altor animale din casă.', 'general', 'adopție')
) as v(title, body, species, category)
cross join lateral (
  select id from public.profiles where role = 'admin' limit 1
) as p
where not exists (select 1 from public.edu_articles where title = v.title);
