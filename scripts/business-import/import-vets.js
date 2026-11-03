#!/usr/bin/env node
/**
 * Import pentru public.vets — cabinete veterinare reale din OSM Overpass
 * (amenity=veterinary), cu coordonate native (rezolva geocodarea, spre
 * deosebire de Nominatim care trebuie sa ghiceasca dintr-o adresa text).
 *
 * De ce separat de import.js: tinta e public.vets, nu business_listings
 * — schema difera (clinic_name nu name, is_licensed/experienced_team/
 * modern_facility, fara camp "category"), iar vets are deja propriul
 * ecosistem (vet_appointments, vet_reviews, vet_services) construit in
 * jurul lui.
 *
 * Pipeline-ul DSVSA (liste judetene oficiale, pawfectpair-design/) NU e
 * portat aici — doar 2 din 42 de judete au pagini configurate in acel
 * pipeline, cu formate diferite per judet (unele .xlsx, unele PDF
 * excluse explicit) — ramane pentru o trecere separata daca se cere.
 *
 * NU a fost rulat de Claude — scrierea in baza de date de productie
 * necesita rularea explicita de catre user.
 *
 * Rulare:
 *   node import-vets.js --dry-run   # descarca + parseaza, NU scrie in DB
 *   node import-vets.js             # import real
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { normalizeCity } = require("./normalize-city");

const USER_AGENT = "PawfectPairImportPipeline/1.0 (+https://pawfectpair.app)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const VET_QUERY = (cc) =>
  `[out:json][timeout:180];area["ISO3166-1"="${cc}"][admin_level=2]->.a;nwr["amenity"="veterinary"](area.a);out center tags;`;

function parseArgs() {
  const args = process.argv.slice(2);
  return { dryRun: args.includes("--dry-run") };
}

/** Acelasi tipar ca import.js — preferam pooler-ul (IPv4), hostul direct rezolva des doar IPv6. */
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

async function fetchOverpass(query) {
  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`  Overpass ${endpoint} (incercarea ${attempt})...`);
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
        });
        if (resp.ok) return await resp.json();
        console.warn(`  -> HTTP ${resp.status}`);
        if (resp.status === 429 || resp.status === 502 || resp.status === 504) {
          await sleep(attempt * 5000);
          continue;
        }
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`  -> esuat: ${e.message}`);
        await sleep(attempt * 3000);
      }
    }
  }
  throw new Error(`Niciun endpoint Overpass nu a raspuns: ${lastErr?.message ?? "necunoscut"}`);
}

function parseVets(elements) {
  const rows = [];
  let skippedNoName = 0;
  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags.operator || tags.brand;
    if (!name) {
      skippedNoName++;
      continue;
    }
    const lat = el.lat ?? el.center?.lat ?? null;
    const lng = el.lon ?? el.center?.lon ?? null;
    const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
    const rawCity = tags["addr:city"] || tags["addr:suburb"] || null;
    rows.push({
      clinic_name: name,
      city: rawCity ? normalizeCity(rawCity) : null,
      address: street || null,
      lat,
      lng,
      phone: tags.phone || tags["contact:phone"] || null,
      source: "osm",
      source_id: `${el.type}/${el.id}`,
    });
  }
  return { rows, skippedNoName };
}

async function fetchVetsFromOsm() {
  console.log(`\n[OSM] veterinari — interoghez Overpass (amenity=veterinary)...`);
  const data = await fetchOverpass(VET_QUERY("RO"));
  const elements = data.elements || [];
  const { rows, skippedNoName } = parseVets(elements);
  console.log(`[OSM] veterinari: ${elements.length} rezultate, ${rows.length} cu nume (${skippedNoName} fara nume, ignorate)`);
  return rows;
}

async function upsertVets(client, rows) {
  let inserted = 0;
  let updated = 0;
  for (const r of rows) {
    // user_id ramane NULL — cabinet importat, revendicabil, nu are cont asociat.
    const res = await client.query(
      `insert into public.vets
         (clinic_name, city, address, phone, lat, lng, source, source_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (source, source_id) do update set
         clinic_name = excluded.clinic_name, city = excluded.city, address = excluded.address,
         phone = excluded.phone, lat = excluded.lat, lng = excluded.lng
       returning (xmax = 0) as inserted`,
      [r.clinic_name, r.city, r.address, r.phone, r.lat, r.lng, r.source, r.source_id]
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  return { inserted, updated };
}

async function main() {
  const { dryRun } = parseArgs();
  const rows = await fetchVetsFromOsm();

  console.log(`\nTotal randuri de importat: ${rows.length}`);

  if (dryRun) {
    console.log("\n--dry-run: nu scriu in DB. Exemple:");
    for (const r of rows.slice(0, 10)) {
      console.log(`  ${r.clinic_name} — ${r.city ?? "?"} — tel=${r.phone ?? "-"} — lat/lng=${r.lat ?? "-"},${r.lng ?? "-"}`);
    }
    return;
  }

  const dbUrl = loadDbUrl();
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { inserted, updated } = await upsertVets(client, rows);
    console.log(`[DB] vets: ${inserted} noi, ${updated} actualizate`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Import esuat:", e);
  process.exit(1);
});
