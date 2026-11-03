#!/usr/bin/env node
/**
 * Geocodare vets.lat/lng — public.vets are doar city/address text, deloc
 * coordonate (vezi migratia 0072). Foloseste Nominatim (OpenStreetMap,
 * gratuit, fara cheie API) — nu exista nicio cheie Google Geocoding in
 * acest proiect utilizabila server-side (singura cheie Google e cea de
 * Maps SDK din mobile/app.json, restrictionata pe package+SHA-1 Android,
 * respinsa de Google daca e folosita dintr-un script).
 *
 * Respecta politica de utilizare Nominatim: max 1 cerere/secunda,
 * User-Agent descriptiv, fara paralelism.
 *
 * Rulare:
 *   node geocode-vets.js --dry-run              # geocodeaza + afiseaza, NU scrie in DB
 *   node geocode-vets.js --dry-run --limit=10    # testeaza pe primii 10
 *   node geocode-vets.js                         # geocodeaza real + scrie lat/lng in DB
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const USER_AGENT = "PawfectPairImportPipeline/1.0 (+https://pawfectpair.app)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = 1100; // Nominatim: max 1 cerere/secunda — adaugam o marja

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  return {
    dryRun: args.includes("--dry-run"),
    limit: limitArg ? parseInt(limitArg.split("=")[1], 10) : null,
  };
}

function loadDbUrl() {
  if (process.env.SUPABASE_DB_POOLER_URL) return process.env.SUPABASE_DB_POOLER_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const envPath = path.join(__dirname, "..", "..", "web", ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  const values = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^(SUPABASE_DB_POOLER_URL|SUPABASE_DB_URL)\s*=\s*(.+)\s*$/);
    if (m) values[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  const url = values.SUPABASE_DB_POOLER_URL || values.SUPABASE_DB_URL;
  if (!url) throw new Error(`SUPABASE_DB_POOLER_URL / SUPABASE_DB_URL nu au fost gasite in ${envPath}`);
  return url;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(query) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=ro&q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) throw new Error(`Nominatim HTTP ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
}

async function main() {
  const { dryRun, limit } = parseArgs();
  const client = new Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(
      `select id, clinic_name, city, address from public.vets
       where lat is null and (address is not null or city is not null)
       order by created_at asc`
    );
    let candidates = res.rows;
    if (limit) candidates = candidates.slice(0, limit);

    console.log(`Veterinari fara coordonate, de procesat: ${candidates.length} (din ${res.rows.length} total eligibili)\n`);

    let matched = 0;
    let noMatch = 0;
    const noMatchList = [];

    for (const v of candidates) {
      const query = v.address && v.city
        ? `${v.address}, ${v.city}, Romania`
        : v.address
          ? `${v.address}, Romania`
          : `${v.city}, Romania`;

      let result;
      try {
        result = await geocode(query);
      } catch (e) {
        console.warn(`  [eroare] ${v.clinic_name}: ${e.message}`);
        noMatch++;
        noMatchList.push(v);
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      if (result) {
        matched++;
        console.log(`  [ok] ${v.clinic_name} — "${query}" -> ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
        if (!dryRun) {
          await client.query(`update public.vets set lat = $1, lng = $2 where id = $3`, [result.lat, result.lng, v.id]);
        }
      } else {
        noMatch++;
        noMatchList.push(v);
        console.log(`  [fara rezultat] ${v.clinic_name} — "${query}"`);
      }

      await sleep(RATE_LIMIT_MS);
    }

    const skipped = res.rows.length - candidates.length;
    console.log(`\nRezumat: ${matched} geocodate, ${noMatch} fara rezultat, ${skipped} nerulat (limita --limit)`);
    if (noMatchList.length > 0) {
      console.log("\nAdrese care nu s-au putut geocodeaza (verifica manual):");
      for (const v of noMatchList) console.log(`  - ${v.clinic_name}: "${v.address ?? ""}" / "${v.city ?? ""}"`);
    }
    if (dryRun) console.log("\n--dry-run: nu am scris nimic in DB.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Geocodare esuata:", e);
  process.exit(1);
});
