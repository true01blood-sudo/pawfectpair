/**
 * Utils cadrul legal OUG 55/2002 (câini periculoși/agresivi) + Legea 258/2013.
 * Detectare rasă din textul liber al utilizatorului + checklist conformitate.
 * Testate unitar în packages/shared/__tests__/oug50.test.ts.
 */

import {
  OUG50_CAT1_BREEDS,
  OUG50_CAT2_BREEDS,
  OUG50_BREED_ALIASES,
} from '../constants/pet';

/** 0 = nu e incadrat, 1 = categoria I (luptă/atac), 2 = categoria II (agresivi) */
export type Oug50Category = 0 | 1 | 2;

/** Normalizează numele rasei: lowercase, fără diacritice, spații simple, fără puncte. */
export function normalizeBreedName(breed: string | null | undefined): string {
  if (!breed) return '';
  return breed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/[.,;:()\-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rezolvă aliasul (ex. „amstaff") la denumirea oficială, sau null. */
function resolveAlias(normalized: string): string | null {
  // exact match pe cheie
  if (OUG50_BREED_ALIASES[normalized]) return OUG50_BREED_ALIASES[normalized];
  // match pe sub-șir: „metis amstaff" → 'amstaff'
  for (const [key, canonical] of Object.entries(OUG50_BREED_ALIASES)) {
    if (normalized.includes(key)) return canonical;
  }
  return null;
}

/** Verifică dacă numele oficial apare ca sub-șir în textul normalizat. */
function matchesOfficial(normalized: string, official: string): boolean {
  const n = normalizeBreedName(normalized);
  const o = normalizeBreedName(official);
  if (!n || !o) return false;
  if (n.includes(o)) return true;
  // și fără spații: „boer bull" → „boerbull" matchuiește „Boerbull"
  const nSq = n.replace(/\s/g, '');
  const oSq = o.replace(/\s/g, '');
  return nSq.includes(oSq);
}

/**
 * Detectează categoria OUG 55/2002 pentru o rasă scrisă liber.
 * Prioritate: categoria I (mai strictă) peste categoria II.
 * „Metis" / „cross" nu schimbă rezultatul — se analizează restul textului.
 */
export function detectOug50Category(breed: string | null | undefined): Oug50Category {
  const n = normalizeBreedName(breed);
  if (!n) return 0;

  const canonical = resolveAlias(n);
  const canonicalNorm = canonical ? normalizeBreedName(canonical) : null;

  for (const b of OUG50_CAT1_BREEDS) {
    if ((canonicalNorm && matchesOfficial(canonicalNorm, b)) || matchesOfficial(n, b)) return 1;
  }
  for (const b of OUG50_CAT2_BREEDS) {
    if ((canonicalNorm && matchesOfficial(canonicalNorm, b)) || matchesOfficial(n, b)) return 2;
  }
  return 0;
}

/** ID-urile acțiunilor din checklist (ce poate bifa stăpânul în aplicație). */
export type Oug50ActionId =
  | 'owner_18'       // posesor 18+ ani
  | 'registration'   // înregistrare la poliție
  | 'microchip'      // identificare microchip
  | 'insurance'      // asigurare răspundere civilă
  | 'sign'           // afiș avertizare la poartă/ușă
  | 'sterilized';    // sterilizare

export interface Oug50Requirement {
  /** 'action' = poate fi bifat în checklist; 'info' = regulă permanentă de respectat */
  kind: 'action' | 'info';
  id: Oug50ActionId | 'muzzle_leash' | 'no_public_venues';
  /** i18n key: oug50.req.{id} */
  legalRef: string;
}

/**
 * Cerințele legale per categorie (informative în aplicație).
 * Cat I: toate; Cat II: fără restricțiile de acces specifice cat I.
 */
export function oug50Requirements(category: 1 | 2): Oug50Requirement[] {
  if (category === 1) {
    return [
      { kind: 'action', id: 'owner_18', legalRef: 'OUG 55/2002' },
      { kind: 'action', id: 'registration', legalRef: 'OUG 55/2002' },
      { kind: 'action', id: 'microchip', legalRef: 'Legea 258/2013' },
      { kind: 'info', id: 'muzzle_leash', legalRef: 'OUG 55/2002' },
      { kind: 'info', id: 'no_public_venues', legalRef: 'OUG 55/2002' },
      { kind: 'action', id: 'insurance', legalRef: 'OUG 55/2002' },
      { kind: 'action', id: 'sign', legalRef: 'OUG 55/2002' },
      { kind: 'action', id: 'sterilized', legalRef: 'OUG 55/2002' },
    ];
  }
  return [
    { kind: 'action', id: 'owner_18', legalRef: 'OUG 55/2002' },
    { kind: 'action', id: 'registration', legalRef: 'OUG 55/2002' },
    { kind: 'action', id: 'microchip', legalRef: 'Legea 258/2013' },
    { kind: 'info', id: 'muzzle_leash', legalRef: 'OUG 55/2002' },
    { kind: 'action', id: 'insurance', legalRef: 'OUG 55/2002' },
    { kind: 'action', id: 'sign', legalRef: 'OUG 55/2002' },
    { kind: 'action', id: 'sterilized', legalRef: 'OUG 55/2002' },
  ];
}

/** Acțiunile bifabile din checklist, în ordinea afișării. */
export function oug50ChecklistActions(category: 1 | 2): Oug50ActionId[] {
  return oug50Requirements(category)
    .filter((r) => r.kind === 'action')
    .map((r) => r.id as Oug50ActionId);
}

/** Câmpurile booleene OUG stocate pe pets (coloane DB). */
export const OUG50_PET_FIELDS = [
  'oug50_owner_18',
  'oug50_registration',
  'oug50_microchip',
  'oug50_insurance',
  'oug50_sign',
  'oug50_sterilized',
] as const;

export type Oug50PetFields = Record<(typeof OUG50_PET_FIELDS)[number], boolean | null | undefined>;

/** Mapare id checklist → coloană pets. */
export const OUG50_ACTION_COLUMN: Record<Oug50ActionId, (typeof OUG50_PET_FIELDS)[number]> = {
  owner_18: 'oug50_owner_18',
  registration: 'oug50_registration',
  microchip: 'oug50_microchip',
  insurance: 'oug50_insurance',
  sign: 'oug50_sign',
  sterilized: 'oug50_sterilized',
};

/** Rezultat conformitate: câte bifate din total + procent. */
export function oug50Compliance(
  pet: Oug50PetFields,
  category: 1 | 2
): { done: number; total: number; complete: boolean; missing: Oug50ActionId[] } {
  const actions = oug50ChecklistActions(category);
  const missing: Oug50ActionId[] = [];
  let done = 0;
  for (const id of actions) {
    if (pet[OUG50_ACTION_COLUMN[id]] === true) done++;
    else missing.push(id);
  }
  return { done, total: actions.length, complete: done === actions.length, missing };
}
