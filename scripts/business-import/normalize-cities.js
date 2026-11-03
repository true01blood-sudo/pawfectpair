#!/usr/bin/env node
/**
 * Curata valorile city din business_listings folosind normalize-city.js.
 *
 * Rulare:
 *   node normalize-cities.js --dry-run   # afiseaza tabelul inainte/dupa, NU scrie in DB
 *   node normalize-cities.js             # aplica UPDATE pentru fiecare valoare schimbata
 *
 * IMPORTANT: ruleaza intai --dry-run si citeste tabelul — normalizarea
 * grupeaza dupa un alias cunoscut de orase mari + reguli generice de
 * sufix de judet; e facuta sa fie conservatoare (lasa neatinse intrarile
 * ambigue, ex. adrese complete sau "Jud. X" fara oras), dar tot merita
 * un ochi uman inainte de rulare reala.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { normalizeCity } = require("./normalize-city");

function parseArgs() {
  const args = process.argv.slice(2);
  return { dryRun: args.includes("--dry-run") };
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

async function main() {
  const { dryRun } = parseArgs();
  const client = new Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(
      `select city, count(*) as c from public.business_listings where city is not null group by city order by c desc`
    );
    const rows = res.rows; // [{ city, c }]
    const mapping = rows
      .map((r) => ({ before: r.city, after: normalizeCity(r.city), count: Number(r.c) }))
      .filter((m) => m.before !== m.after);

    console.log(`Orase distincte in business_listings: ${rows.length}`);
    console.log(`Valori care s-ar schimba: ${mapping.length}\n`);

    if (mapping.length === 0) {
      console.log("Nimic de normalizat — toate valorile sunt deja in forma canonica.");
      return;
    }

    console.log("ÎNAINTE                                                -> DUPĂ                      (randuri afectate)");
    console.log("".padEnd(110, "-"));
    for (const m of mapping) {
      console.log(`${m.before.padEnd(55)} -> ${m.after.padEnd(28)} (${m.count})`);
    }

    if (dryRun) {
      console.log("\n--dry-run: nu am scris nimic in DB. Verifica tabelul de mai sus, apoi ruleaza fara --dry-run.");
      return;
    }

    console.log("\nAplic UPDATE-urile...");
    let totalRows = 0;
    for (const m of mapping) {
      const upd = await client.query(
        `update public.business_listings set city = $1, updated_at = now() where city = $2`,
        [m.after, m.before]
      );
      totalRows += upd.rowCount;
      console.log(`  "${m.before}" -> "${m.after}": ${upd.rowCount} randuri`);
    }
    console.log(`\nGata — ${totalRows} randuri actualizate, ${mapping.length} valori distincte normalizate.`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Normalizare esuata:", e);
  process.exit(1);
});
