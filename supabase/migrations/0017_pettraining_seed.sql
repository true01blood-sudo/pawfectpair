insert into public.edu_articles (title, body, species, category, created_by)
select v.title, v.body, v.species, v.category, p.id
from (values
  ('Comanda de bază "Șezi"', 'Ține o recompensă lângă nasul câinelui, ridic-o încet deasupra capului — capul urmărește mâna și fundul coboară. Spune "Șezi" exact în momentul așezării, recompensează imediat. Repetă 5 minute/zi, 3 zile la rând.', 'caine', 'dresaj'),
  ('Comanda "Vino" cu recompensă', 'Începe într-un spațiu fără distrageri, la 2-3 metri distanță. Spune numele + "Vino" cu voce veselă, recompensează imediat la sosire. Nu chema niciodată câinele pentru a-l certa — asociază comanda doar cu lucruri plăcute.', 'caine', 'dresaj'),
  ('Cum oprești mușcatul la pui de câine', 'Puii mușcă din joacă — scoate un sunet ascuțit "au!" și oprește jocul 10-20 secunde. Oferă o jucărie potrivită pentru mușcat imediat după. Consistența e cheia: toți membrii familiei trebuie să reacționeze la fel.', 'caine', 'dresaj'),
  ('Folosirea litierei — pași corecți', 'Pentru pisici sau pui noi: pune-i lăbuțele ușor în litieră după masă și după somn, fără forțare. Curăță zilnic — pisicile evită litiera murdară. Dacă refuză brusc litiera folosită anterior, poate fi semn medical, nu comportamental.', 'pisica', 'dresaj'),
  ('Câte calorii are nevoie câinele tău', 'Formulă orientativă: 30 x greutate(kg) + 70 = necesar caloric zilnic pentru un câine adult, moderat activ. Câinii sterilizați au nevoie cu ~20% mai puțin. Ajustează în funcție de condiția fizică, nu doar de vârstă.', 'caine', 'alimentație'),
  ('Alimente periculoase pentru câini și pisici', 'De evitat strict: ciocolată, struguri/stafide, ceapă, usturoi, xilitol (îndulcitor), avocado, alcool, cofeină. Chiar și cantități mici pot fi toxice — la ingestie accidentală, sună imediat veterinarul.', 'general', 'alimentație'),
  ('Trecerea la altă hrană — fără deranj digestiv', 'Amestecă treptat hrana nouă cu cea veche timp de 7-10 zile: 25% nouă/75% veche (zilele 1-3), 50/50 (zilele 4-6), 75/25 (zilele 7-9), 100% nouă din ziua 10. Schimbarea bruscă poate cauza diaree.', 'general', 'alimentație'),
  ('Exerciții zilnice de stimulare mentală', 'Ascunde bucăți de hrană prin casă pentru "vânătoare de comori", folosește jucării puzzle cu recompense, sau alternează traseul de plimbare. 15 minute de stimulare mentală obosesc la fel de mult ca 1 oră de alergat.', 'general', 'exerciții')
) as v(title, body, species, category)
cross join lateral (
  select id from public.profiles where role = 'admin' limit 1
) as p
where not exists (select 1 from public.edu_articles where title = v.title);
