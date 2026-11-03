-- ──────────────────────────────────────────
-- 0071: adauga 'transport' la business_listings.category
--
-- Continuare a 0070 — registrul ANSVSA de transportatori autorizati de
-- animale vii (Reg. UE 1/2005) e confirmat fezabil de importat (vezi
-- scraper-ul nou din scripts/business-import/import.js, --only=transport):
-- 3 liste oficiale (rutier scurta/lunga durata, naval), fiecare deja
-- filtrata server-side pe autorizatii active, ~2500 mijloace de
-- transport deduplicate la ~1038 transportatori unici (proprietar+judet).
--
-- Fara adresa/coordonate in sursa (ca si traineri ACh.ro din 0070) —
-- apare doar in lista, nu ca pin pe harta; UI-ul trateaza deja asta
-- corect (lat/lng nule).
--
-- Scris, dar MIGRATIA NU A FOST RULATA de Claude — scrierea in baza de
-- date de productie necesita aprobarea explicita a userului (npx
-- supabase db push --remote), la fel ca 0070 si restul migratiilor din
-- aceasta sesiune.
-- ──────────────────────────────────────────

do $$
declare
  cons record;
begin
  for cons in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'business_listings'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%category%'
  loop
    execute format('alter table public.business_listings drop constraint %I', cons.conname);
  end loop;

  alter table public.business_listings
    add constraint business_listings_category_check
    check (category in ('pet_shop', 'shelter', 'trainer', 'transport'));
end $$;
