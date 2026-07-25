insert into public.forum_posts (author_id, title, body, category)
select id, 'Bine ați venit pe forumul PawfectPair!',
  'Aici puteți întreba orice despre îngrijirea animalelor, împărtăși povești de adopție sau cere sfaturi comunității. Fiți respectuoși și empatici unii cu ceilalți.',
  'Recomandări'
from public.profiles where role = 'admin' limit 1
on conflict do nothing;
