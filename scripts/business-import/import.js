#!/usr/bin/env node
/**
 * Import pentru public.business_listings — magazine pentru animale +
 * adaposturi/centre de adoptie (OSM Overpass), traineri (ACh.ro, best-effort).
 *
 * NU a fost rulat de Claude — scrierea in baza de date de productie
 * necesita rularea explicita de catre user (vezi README.md).
 *
 * Rulare:
 *   cd scripts/business-import
 *   npm install
 *   node import.js                 # toate categoriile
 *   node import.js --only=osm      # doar OSM (shop/shelter)
 *   node import.js --only=ach      # doar traineri ACh.ro
 *   node import.js --dry-run       # descarca + parseaza, NU scrie in DB
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

const OSM_QUERIES = {
  pet_shop: (cc) =>
    `[out:json][timeout:180];area["ISO3166-1"="${cc}"][admin_level=2]->.a;nwr["shop"="pet"](area.a);out center tags;`,
  shelter: (cc) =>
    `[out:json][timeout:180];area["ISO3166-1"="${cc}"][admin_level=2]->.a;nwr["amenity"="animal_shelter"](area.a);out center tags;`,
};

const ACH_PAGES = [
  "https://www.ach.ro/site/index.php/ro/instructori-dresaj/instructori-dresaj",
  "https://ach.ro/site/index.php/ro/instructori-dresaj/asistenti-dresaj",
];

// Registrul ANSVSA de transportatori autorizati de animale vii (Reg. UE 1/2005).
// Fiecare view e deja filtrat server-side pe "activ" (nu mai trebuie cerute
// separat MTSuspendate/MTAnulate/MTLSuspendate/etc. — acelea sunt liste
// separate de autorizatii suspendate/anulate, nu fac parte din acest import).
const ANSVSA_BASE = "https://domino.iqm.ro/ansv/ansvsa.nsf";
const ANSVSA_LISTS = [
  { view: "MT", label: "rutier, scurta durata" },
  { view: "MTL", label: "rutier, lunga durata" },
  { view: "MTN", label: "naval" },
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    only: (args.find((a) => a.startsWith("--only="))?.split("=")[1]) || "all",
    dryRun: args.includes("--dry-run"),
  };
}

/**
 * Citeste conexiunea Postgres din web/.env.local, fara sa depinda de shell env.
 * Preferam POOLER_URL — hostul direct (db.<ref>.supabase.co) rezolva deseori
 * doar pe IPv6, ceea ce pica cu ENOTFOUND pe multe retele/Windows; pooler-ul
 * (PgBouncer, aws-0-<regiune>.pooler.supabase.com) e IPv4-compatibil.
 */
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
        break; // alta eroare HTTP — trecem la urmatorul endpoint
      } catch (e) {
        lastErr = e;
        console.warn(`  -> esuat: ${e.message}`);
        await sleep(attempt * 3000);
      }
    }
  }
  throw new Error(`Niciun endpoint Overpass nu a raspuns: ${lastErr?.message ?? "necunoscut"}`);
}

function parseOsmElements(elements, category) {
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
      category,
      name,
      city: rawCity ? normalizeCity(rawCity) : null,
      address: street || null,
      lat,
      lng,
      phone: tags.phone || tags["contact:phone"] || null,
      website: tags.website || tags["contact:website"] || null,
      description: null,
      source: "osm",
      source_id: `${el.type}/${el.id}`,
    });
  }
  return { rows, skippedNoName };
}

async function fetchOsmCategory(category) {
  console.log(`\n[OSM] ${category} — interoghez Overpass...`);
  const query = OSM_QUERIES[category]("RO");
  const data = await fetchOverpass(query);
  const elements = data.elements || [];
  const { rows, skippedNoName } = parseOsmElements(elements, category);
  console.log(`[OSM] ${category}: ${elements.length} rezultate, ${rows.length} cu nume (${skippedNoName} fara nume, ignorate)`);
  return rows;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseAchTable(html) {
  const rows = [];
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 2) continue;
    // td-ul cu poza e fie primul (are <img>), fie gol — numele e in urmatorul td cu <strong>.
    const nameCell = tds.find((td) => /<strong>/i.test(td)) || tds[1] || tds[0];
    const nameMatch = nameCell.match(/<strong>([\s\S]*?)<\/strong>/i);
    const name = nameMatch ? stripTags(nameMatch[0]).join(" ").trim() : null;
    if (!name || name.length < 4) continue;

    const nameCellLines = stripTags(nameCell);
    const addressLines = nameCellLines.slice(1); // restul liniilor din acelasi td = oras/adresa
    // Cand sursa nu separa oras/adresa pe linii distincte, prima linie e
    // uneori adresa intreaga ("Com. X, Sat. Y, Str. Z nr. N") — nu un oras.
    const firstLineIsFullAddress = addressLines[0] && /\b(str\.|sat\.|com\.|nr\.)\b/i.test(addressLines[0]);
    const city = firstLineIsFullAddress ? null : addressLines[0] || null;
    const address = firstLineIsFullAddress ? addressLines.join(", ") : addressLines.slice(1).join(", ") || null;

    const lastCell = tds[tds.length - 1];
    const phoneMatch = stripTags(lastCell).join(" ").match(/0\d[\d\s]{7,}\d/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : null;

    const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    rows.push({
      category: "trainer",
      name,
      city,
      address,
      lat: null,
      lng: null,
      phone,
      website: null,
      description: "Instructor dresaj canin autorizat — Asociația Chinologică Română (ACh.ro).",
      source: "ach",
      source_id: slug,
    });
  }
  return rows;
}

async function fetchAchTrainers() {
  console.log(`\n[ACH] traineri — descarc paginile oficiale...`);
  const all = [];
  for (const url of ACH_PAGES) {
    try {
      const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!resp.ok) {
        console.warn(`[ACH] ${url} -> HTTP ${resp.status}, ignor`);
        continue;
      }
      const html = await resp.text();
      const rows = parseAchTable(html);
      console.log(`[ACH] ${url}: ${rows.length} intrari parsate`);
      all.push(...rows);
      await sleep(1500); // politete — nu lovim ach.ro cu cereri inlantuite
    } catch (e) {
      console.warn(`[ACH] ${url} esuat: ${e.message}, ignor`);
    }
  }
  // dedup dupa slug (listele de instructori + asistenti se pot suprapune)
  const seen = new Set();
  const deduped = all.filter((r) => (seen.has(r.source_id) ? false : (seen.add(r.source_id), true)));
  console.log(`[ACH] total unic: ${deduped.length}`);
  return deduped;
}

/**
 * Site-ul ANSVSA (domino.iqm.ro, Lotus/HCL Domino) nu randeaza un <table> —
 * fiecare rand e <div class="TR"> cu 5 celule <p class="p14...">: Judet, Nr.
 * (id intern), Nr. circulatie (placa), Proprietar, Autorizatie (istoric
 * complet, intrari separate prin <br/> — ultima intrare = starea curenta).
 */
function decodeAnsvsaEntities(s) {
  return s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function parseAnsvsaRows(html) {
  const ovaIdx = html.indexOf('<div class="OVA">');
  if (ovaIdx === -1) return [];
  const scoped = html.slice(ovaIdx);
  const chunks = scoped.split('<div class="TR">').slice(1);
  const cellRe = /<p class="p14[^"]*">([\s\S]*?)<\/p>/g;
  const rows = [];
  for (const c of chunks) {
    cellRe.lastIndex = 0;
    const cells = [];
    let m;
    while ((m = cellRe.exec(c)) && cells.length < 5) cells.push(decodeAnsvsaEntities(m[1]));
    if (cells.length === 5 && cells[0] !== "Judet") {
      rows.push({ judet: cells[0], owner: cells[3], authHistory: cells[4] });
    }
  }
  return rows;
}

/** Status curent = ultima intrare din istoricul Autorizatie (separate prin <br/>). */
function isCurrentlyActive(authHistory) {
  const entries = authHistory.split(/<br\s*\/?>/i).map((e) => e.trim()).filter(Boolean);
  const last = entries[entries.length - 1] || "";
  return /^activa/i.test(last);
}

/** Paginare Domino: prima pagina fara parametru, apoi ?OpenForm&Start=500,1000,... */
async function fetchAnsvsaView(view) {
  const rows = [];
  let start = 0;
  for (let page = 0; page < 20; page++) { // siguranta — max 20 pagini (10.000 randuri)
    const url = start === 0 ? `${ANSVSA_BASE}/${view}` : `${ANSVSA_BASE}/${view}?OpenForm&Start=${start}`;
    let html;
    try {
      const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!resp.ok) {
        console.warn(`  ${view} Start=${start} -> HTTP ${resp.status}, opresc paginarea`);
        break;
      }
      html = await resp.text();
    } catch (e) {
      console.warn(`  ${view} Start=${start} esuat: ${e.message}, opresc paginarea`);
      break;
    }
    const pageRows = parseAnsvsaRows(html);
    rows.push(...pageRows);
    if (pageRows.length === 0 || !html.includes("Urmatoarele")) break;
    start += 500;
    await sleep(800); // politete fata de domino.iqm.ro
  }
  return rows;
}

async function fetchTransportListings() {
  console.log(`\n[ANSVSA] transport — descarc registrul oficial de transportatori...`);
  const byOwner = new Map(); // key: judet|proprietar -> { judet, owner }
  for (const { view, label } of ANSVSA_LISTS) {
    const rows = await fetchAnsvsaView(view);
    let active = 0;
    for (const r of rows) {
      if (!isCurrentlyActive(r.authHistory)) continue;
      active++;
      const key = `${r.judet}|${r.owner}`;
      if (!byOwner.has(key)) byOwner.set(key, { judet: r.judet, owner: r.owner });
    }
    console.log(`[ANSVSA] ${view} (${label}): ${rows.length} mijloace de transport, ${active} cu autorizatie activa`);
    await sleep(800);
  }

  const unique = Array.from(byOwner.values());
  console.log(`[ANSVSA] transportatori unici (deduplicat pe proprietar+judet, doar activi): ${unique.length}`);

  return unique.map(({ judet, owner }) => {
    const slug =
      owner.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") +
      "-" + judet.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return {
      category: "transport",
      name: owner,
      city: null,
      address: null,
      lat: null,
      lng: null,
      phone: null,
      website: null,
      description: `Transportator autorizat animale vii — jud. ${judet}.`,
      source: "ansvsa",
      source_id: slug,
    };
  });
}

async function upsertRows(client, rows) {
  let inserted = 0;
  let updated = 0;
  for (const r of rows) {
    const res = await client.query(
      `insert into public.business_listings
         (category, name, city, address, lat, lng, phone, website, description, source, source_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (source, source_id) do update set
         name = excluded.name, city = excluded.city, address = excluded.address,
         lat = excluded.lat, lng = excluded.lng, phone = excluded.phone,
         website = excluded.website, description = excluded.description,
         updated_at = now()
       returning (xmax = 0) as inserted`,
      [r.category, r.name, r.city, r.address, r.lat, r.lng, r.phone, r.website, r.description, r.source, r.source_id]
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  return { inserted, updated };
}

async function main() {
  const { only, dryRun } = parseArgs();
  const allRows = [];

  if (only === "all" || only === "osm") {
    allRows.push(...(await fetchOsmCategory("pet_shop")));
    allRows.push(...(await fetchOsmCategory("shelter")));
  }
  if (only === "all" || only === "ach") {
    allRows.push(...(await fetchAchTrainers()));
  }
  if (only === "all" || only === "transport") {
    allRows.push(...(await fetchTransportListings()));
  }

  console.log(`\nTotal randuri de importat: ${allRows.length}`);

  if (dryRun) {
    console.log("\n--dry-run: nu scriu in DB. Exemple:");
    for (const r of allRows.slice(0, 10)) {
      console.log(`  [${r.category}/${r.source}] ${r.name} — ${r.city ?? "?"} — tel=${r.phone ?? "-"}`);
    }
    return;
  }

  const dbUrl = loadDbUrl();
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const byCategory = {};
    for (const r of allRows) {
      byCategory[r.category] = byCategory[r.category] || [];
      byCategory[r.category].push(r);
    }
    for (const [category, rows] of Object.entries(byCategory)) {
      const { inserted, updated } = await upsertRows(client, rows);
      console.log(`[DB] ${category}: ${inserted} noi, ${updated} actualizate`);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Import esuat:", e);
  process.exit(1);
});
