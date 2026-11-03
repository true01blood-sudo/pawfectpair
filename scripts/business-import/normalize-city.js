#!/usr/bin/env node
/**
 * Normalizare nume oras pentru datele OSM din business_listings — raw
 * Overpass da variante inconsistente (cu/fara diacritice, cu/fara
 * sufix de judet, hyphenation diferita). Functie pura, reutilizata atat
 * de scriptul de curatare (normalize-cities.js) cat si de import.js
 * (ca sa nu mai reintroducem mizeria la fiecare import nou).
 */
"use strict";

// Corectie caractere cedila (gresite tipografic) -> virgula-dedesubt (corecte in romana).
// Multe surse (inclusiv OSM) folosesc ş/ţ (cedila, Turkish-style) in loc de ș/ț (romanesti).
const CEDILLA_FIX = { "Ş": "Ș", "ş": "ș", "Ţ": "Ț", "ţ": "ț" };
function fixCedilla(s) {
  return s.replace(/[ŞşŢţ]/g, (c) => CEDILLA_FIX[c] ?? c);
}

function stripDiacriticsLower(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Varianta fara diacritice / hyphenation inconsistenta -> forma canonica (cu diacritice romanesti).
// Acopera orasele mari + cele observate deja in datele live (vezi raportul din conversatie).
const CITY_ALIASES = {
  "bucuresti": "București",
  "cluj napoca": "Cluj-Napoca",
  "timisoara": "Timișoara",
  "iasi": "Iași",
  "constanta": "Constanța",
  "brasov": "Brașov",
  "craiova": "Craiova",
  "galati": "Galați",
  "ploiesti": "Ploiești",
  "oradea": "Oradea",
  "braila": "Brăila",
  "arad": "Arad",
  "pitesti": "Pitești",
  "sibiu": "Sibiu",
  "bacau": "Bacău",
  "targu mures": "Târgu Mureș",
  "baia mare": "Baia Mare",
  "buzau": "Buzău",
  "botosani": "Botoșani",
  "satu mare": "Satu Mare",
  "ramnicu valcea": "Râmnicu Vâlcea",
  "drobeta turnu severin": "Drobeta-Turnu Severin",
  "suceava": "Suceava",
  "piatra neamt": "Piatra-Neamț",
  "targu jiu": "Târgu Jiu",
  "focsani": "Focșani",
  "deva": "Deva",
  "zalau": "Zalău",
  "tulcea": "Tulcea",
  "giurgiu": "Giurgiu",
  "voluntari": "Voluntari",
  "slobozia": "Slobozia",
  "vaslui": "Vaslui",
  "husi": "Huși",
  "fagaras": "Făgăraș",
  "rasnov": "Râșnov",
  "alexandria": "Alexandria",
  "dej": "Dej",
  "sfantu gheorghe": "Sfântu Gheorghe",
  "miercurea ciuc": "Miercurea Ciuc",
  "balotesti": "Balotești",
  "chiajna": "Chiajna",
  "gaesti": "Găești",
  "curtea de arges": "Curtea de Argeș",
  "negresti oas": "Negrești-Oaș",
  "rosiorii de vede": "Roșiorii de Vede",
  "dobrotesti": "Dobrotești",
  "busteni": "Bușteni",
  "caldararu": "Caldăraru",
};

/**
 * Normalizeaza un nume de oras brut din OSM.
 * - Lasa neatinse intrarile care par a fi o adresa intreaga (contin Str./Sat./Com./Nr.)
 *   sau doar un judet fara oras ("Jud. X") — prea riscant sa le "reparam" cu o regula generica.
 * - Pentru restul: scoate "Municipiul " / sufixele de judet (", Jud. X", ", Ilfov"),
 *   repara caracterele cedila, mapeaza la forma canonica cunoscuta daca exista.
 */
function normalizeCity(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Adresa completa deghizata in "oras" — nu atingem structura, doar reparam diacriticele.
  if (/\b(str\.|sat\.|com\.|nr\.)\b/i.test(trimmed)) return fixCedilla(trimmed);
  // Doar "Jud. X", fara nicio virgula (nu avem numele orasului) — nimic de normalizat.
  if (/^jud\.?\s/i.test(trimmed) && !trimmed.includes(",")) return fixCedilla(trimmed);

  let s = fixCedilla(trimmed);
  s = s.replace(/^municipiul\s+/i, "");
  s = s.replace(/,\s*jud\.?\s*[^,]+$/i, "");                 // ", Jud. X"
  s = s.replace(/,\s*jude[tț]ul?\.?\s*[^,]+$/i, "");         // ", judetul X" / ", județul X"
  s = s.replace(/,\s*ilfov\s*$/i, "");                        // ", Ilfov"
  s = s.trim().replace(/,\s*$/, "");

  if (!s) return trimmed;

  const key = stripDiacriticsLower(s).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];

  return s;
}

module.exports = { normalizeCity, fixCedilla };
