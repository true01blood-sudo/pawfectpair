# Import activități conexe — business_listings

Populează `public.business_listings` (migrația `0070_business_listings.sql`) cu date
reale din surse publice:

- **OSM Overpass** — `shop=pet` (magazine) și `amenity=animal_shelter` (adăposturi/centre
  de adopție), pentru România.
- **ACh.ro** — lista oficială de instructori/asistenți de dresaj canin autorizați
  (Asociația Chinologică Română), scraping best-effort pe HTML public.

Nu include încă transportatorii (registrul ANSVSA) — sursă confirmată fezabilă
separat, dar scraper-ul nu a fost construit.

## Pași

1. **Aplică migrația** (cineva cu acces trebuie să o ruleze — Claude nu scrie în baza
   de date de producție fără aprobare explicită):
   ```bash
   npx supabase db push --remote
   ```
2. **Instalează dependențele** (o singură dată):
   ```bash
   cd scripts/business-import
   npm install
   ```
3. **Testează fără să scrii în DB**:
   ```bash
   node import.js --dry-run
   ```
4. **Rulează importul real**:
   ```bash
   node import.js
   ```
   Citește automat `SUPABASE_DB_URL` din `web/.env.local` — nu are nevoie de alt
   secret. Scrie direct prin conexiunea Postgres (ocolește RLS), upsert idempotent
   pe `(source, source_id)` — poți rula scriptul de mai multe ori fără duplicate.

   Opțional, doar o sursă: `node import.js --only=osm` sau `node import.js --only=ach`.

## Ce observă

- Overpass API (public, gratuit) poate fi congestionat ocazional (HTTP 502/429) —
  scriptul reîncearcă automat (backoff) pe 4 endpoint-uri cunoscute înainte să
  renunțe.
- Rândurile OSM fără `name` sunt ignorate (nu publicăm POI-uri neidentificate).
- Pentru ACh.ro, câmpul `phone` e extras best-effort dintr-un regex pe text brut —
  verifică manual câteva rânduri după import.

## Ce urmează (neconstruit încă)

- Wiring UI: harta mobil (`mobile/app/(tabs)/harta.tsx`) rulează încă pe date demo —
  va fi conectată la `business_listings` într-un pas separat, odată ce tabela chiar
  există în producție și poate fi testată real.
- O pagină web de director (nu există deloc o hartă pe web momentan).
- Categoria `transport` (registrul ANSVSA — confirmat fezabil, ~2500 înregistrări
  pe 9 URL-uri de listă, vezi raportul de research din conversație).
