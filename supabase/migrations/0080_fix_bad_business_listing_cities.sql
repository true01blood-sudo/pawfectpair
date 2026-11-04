-- ──────────────────────────────────────────
-- 0080: curata business_listings.city unde contine de fapt o adresa
-- completa ("Com. X, Sat. Y, Str. Z nr. N") in loc de un nume de oras.
--
-- Cauza: parseAchTable (scripts/business-import/import.js) ia prima
-- linie ramasa dupa nume ca sa fie "orasul" — pentru traineri unde ACh.ro
-- nu separa oras/adresa pe linii distincte, acolo ajunge adresa intreaga.
-- UI-ul (/aproape) deja filtreaza aceste valori din chip-urile de oras
-- (web/src/app/aproape/page.tsx), dar ramane murdarie in date.
--
-- Mutam valoarea gresita in address (doar daca address e gol, ca sa nu
-- suprascriem ceva real) si golim city — mai bine lipsa decat gresit.
-- ──────────────────────────────────────────

update public.business_listings
set
  address = coalesce(address, city),
  city = null
where city ~* '\m(str\.|sat\.|com\.|nr\.)\M';
