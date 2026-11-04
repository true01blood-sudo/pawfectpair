-- ──────────────────────────────────────────
-- 0079: rol 'staff' + acces pe module pentru admin panel + rol 'trainer'
--
-- Pana acum orice cont cu role = 'admin' avea acces complet la tot
-- panoul /admin, si orice alt rol era respins in bloc — nu exista nicio
-- varianta de acces partial (ex: un moderator care vede doar Moderare +
-- Dovezi, fara Plati sau Setari).
--
-- 'staff' e un rol nou, separat de 'admin': un cont staff vede DOAR
-- modulele listate in admin_modules (chei din ADMIN_MODULES,
-- web/src/lib/admin-access.ts). 'admin' ramane neschimbat — acces
-- complet necondiționat, admin_modules e ignorat pentru el.
--
-- 'trainer' completeaza lista de roluri de business (vet/shop/shelter/
-- pensiune) — edu_trainers.user_id leaga deja un profil de un trainer,
-- dar profiles.role nu avea o valoare dedicata pentru el.
-- ──────────────────────────────────────────

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'vet', 'shelter', 'shop', 'pensiune', 'trainer', 'admin', 'staff'));

alter table public.profiles
  add column if not exists admin_modules text[] not null default '{}';
