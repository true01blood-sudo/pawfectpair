# Import activități conexe — business_listings

Populează `public.business_listings` (migrațiile `0070_business_listings.sql` +
`0071_business_listings_transport_category.sql`) și `public.vets`
(migrațiile `0072_vets_geocoding.sql` + `0074_vets_import_source.sql`) cu
date reale din surse publice:

- **OSM Overpass** — `shop=pet` (magazine) și `amenity=animal_shelter` (adăposturi/centre
  de adopție), pentru România.
- **ACh.ro** — lista oficială de instructori/asistenți de dresaj canin autorizați
  (Asociația Chinologică Română), scraping best-effort pe HTML public.
- **ANSVSA** — registrul oficial de transportatori autorizați de animale vii
  (Reg. UE 1/2005): 3 liste (rutier scurtă/lungă durată, naval), fiecare deja
  filtrată server-side pe autorizații active. Fără adresă/coordonate în sursă —
  apare doar în listă, nu ca pin pe hartă (la fel ca traineri ACh.ro).

## Pași

1. **Aplică migrațiile** (cineva cu acces trebuie să le ruleze — Claude nu scrie în
   baza de date de producție fără aprobare explicită):
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

   Opțional, doar o sursă: `node import.js --only=osm`, `--only=ach` sau
   `--only=transport`.

## Ce observă

- Overpass API (public, gratuit) poate fi congestionat ocazional (HTTP 502/429) —
  scriptul reîncearcă automat (backoff) pe 4 endpoint-uri cunoscute înainte să
  renunțe.
- Rândurile OSM fără `name` sunt ignorate (nu publicăm POI-uri neidentificate).
- Pentru ACh.ro, câmpul `phone` e extras best-effort dintr-un regex pe text brut —
  verifică manual câteva rânduri după import.
- Pentru ANSVSA: site-ul (domino.iqm.ro) paginează la 500 rânduri — scriptul
  urmărește automat linkul "Urmatoarele 500 de documente" până epuizează lista.
  Registrul e per-vehicul (o firmă poate avea mai multe camioane); importăm un
  singur rând per transportator unic (proprietar + județ), doar cele cu
  autorizația curentă activă (ultima intrare din istoricul fiecărui vehicul).

## Import veterinari reali (import-vets.js)

`public.vets` avea doar 2 înregistrări reale (date de test) — pipeline-ul
DSVSA/OSM original (`pawfectpair-design/geolocatie + alte module/`) nu a fost
niciodată conectat la această bază de date de producție (scrie într-o bază
Postgres separată, locală, definită în `schema.sql`/`docker-compose.yml` din
acel folder). `import-vets.js` portează partea OSM a acelui pipeline direct
aici, în `public.vets`, cu aceeași schemă de import (`source`/`source_id`,
upsert idempotent) — aplică mai întâi `supabase/migrations/0074_vets_import_source.sql`.

```bash
node import-vets.js --dry-run   # testează, NU scrie in DB
node import-vets.js             # import real
```

OSM (`amenity=veterinary`) vine deja cu `lat`/`lng` native — rezolvă
geocodarea direct, fără Nominatim, pentru toate cabinetele din această sursă
(testat: 357 cabinete reale, cu coordonate, găsite în România). Aplică
`supabase/migrations/0072_vets_geocoding.sql` înainte (coloanele `lat`/`lng`).

Cabinetele importate au `user_id = NULL` (revendicabile, la fel ca modelul
deja existent pentru `vets`) — nu se inventează conturi.

**Nu portat** — registrul DSVSA (listele județene oficiale, cu autorizația
reală de funcționare): pipeline-ul original are pagini configurate pentru
doar 2 din 42 de județe, cu formate diferite per județ (HTML, `.xlsx`, unele
PDF excluse explicit) — parser mult mai fragil decât Overpass, o trecere
separată dacă se cere.

## Geocodare veterinari din alte surse (geocode-vets.js)

Pentru veterinari fără coordonate native (ex. dacă se adaugă ulterior o sursă
text-only, precum DSVSA) — **Nominatim** (geocodare gratuită OpenStreetMap,
fără cheie; nu există nicio cheie Google Geocoding API utilizabilă
server-side în acest proiect — singura cheie Google e cea de Maps SDK din
`mobile/app.json`, restricționată pe package+SHA-1 Android).

```bash
node geocode-vets.js --dry-run --limit=10   # testează pe primii 10, nu scrie in DB
node geocode-vets.js                        # geocodeaza real toti vets fara lat/lng
```

## Normalizare orașe OSM (normalize-cities.js)

Datele OSM brute au variante inconsistente de oraș (cu/fără diacritice,
cu/fără sufix de județ, hyphenation diferită — ex. "București" / "Bucuresti" /
"Bucuresti, Ilfov" / "Cluj Napoca, Jud. Cluj" toate apărând ca valori
distincte). `normalize-city.js` exportă funcția pură de normalizare (folosită
și de `import.js` la fiecare import nou, ca să nu mai reapară mizeria).

```bash
node normalize-cities.js --dry-run   # afișează tabelul înainte/după, NU scrie in DB
node normalize-cities.js             # aplică UPDATE pentru valorile schimbate
```

Citește intâi tabelul din `--dry-run` — normalizarea e conservatoare (lasă
neatinse intrările ambigue: adrese complete greșit puse în `city`, sau doar
"Jud. X" fără oraș), dar tot merită un ochi uman înainte de rulare reală.
