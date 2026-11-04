-- ──────────────────────────────────────────
-- 0078: notificare automata cu 5 zile inainte de expirarea planului
-- Premium, plus plan_purchased_at (pentru "abonamente recente" in admin).
--
-- pg_net era deja instalat pe acest proiect; pg_cron e disponibil dar
-- nu era activat inca — il activam aici. Daca activarea esueaza din
-- motive de permisiuni (posibil pe unele planuri Supabase, vezi
-- spatial_ref_sys — unele extensii au nevoie de activare din Dashboard,
-- Database -> Extensions, nu doar prin migratie), userul trebuie sa o
-- activeze manual de acolo, apoi restul migratiei (functia + job-ul
-- cron) tot functioneaza normal.
-- ──────────────────────────────────────────

create extension if not exists pg_cron;

alter table public.profiles
  add column if not exists plan_purchased_at timestamptz;

-- Fereastra ingusta (23-25h) ca job-ul zilnic sa prinda fiecare expirare
-- o singura data, nu in fiecare zi cat timp e sub 5 zile.
create or replace function public.notify_expiring_plans()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select
    p.id,
    'system',
    'Abonamentul Premium expiră în curând',
    'Planul tău Premium expiră pe ' || to_char(p.plan_expires_at, 'DD.MM.YYYY') ||
      '. Reînnoiește ca să nu pierzi accesul la modulele Premium.',
    '/planuri'
  from public.profiles p
  where p.plan = 'premium'
    and p.plan_expires_at is not null
    and p.plan_expires_at between now() + interval '4 days 12 hours' and now() + interval '5 days 12 hours'
    -- evitam dubla notificare daca job-ul ruleaza de doua ori in aceeasi fereastra
    and not exists (
      select 1 from public.notifications n
      where n.user_id = p.id
        and n.link = '/planuri'
        and n.title = 'Abonamentul Premium expiră în curând'
        and n.created_at > now() - interval '6 days'
    );
end;
$$;

select cron.schedule(
  'notify-plan-expiry',
  '0 9 * * *', -- zilnic la 09:00 UTC
  $$ select public.notify_expiring_plans(); $$
);
