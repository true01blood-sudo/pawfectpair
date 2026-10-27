/**
 * Utils PetResQ — funcții pure pentru filtrare/sortare cazuri pierdut/găsit.
 * Testate unitar în packages/shared/__tests__/resq.test.ts.
 */
import type {
  ResqCaseWithReporter,
  ResqFilters,
  ResqStatus,
  ResqType,
} from '../types/resq';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Normalizează text pentru căutare diacritice-insensibilă (RO). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .trim();
}

/** Filtrare cazuri după tip, status, oraș și text (nume + descriere + locație). */
export function filterResqCases(
  cases: ResqCaseWithReporter[],
  filters: ResqFilters
): ResqCaseWithReporter[] {
  const search = filters.search ? normalize(filters.search) : null;
  return cases.filter((c) => {
    if (filters.type && c.type !== filters.type) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.city && normalize(filters.city).length >= 2) {
      if (!normalize(c.city ?? '').includes(normalize(filters.city))) return false;
    }
    if (search) {
      const haystack = normalize(
        `${c.name} ${c.description ?? ''} ${c.city ?? ''} ${c.last_seen_location ?? ''}`
      );
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/**
 * Sortare cazuri: active primele (cele mai recente primele),
 * rezolvate la final (tot recente primele).
 */
export function sortResqCases(
  cases: ResqCaseWithReporter[],
  now: Date = new Date()
): ResqCaseWithReporter[] {
  const byNewest = (a: ResqCaseWithReporter, b: ResqCaseWithReporter) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  const active = cases.filter((c) => c.status === 'active').sort(byNewest);
  const resolved = cases.filter((c) => c.status !== 'active').sort(byNewest);
  void now;
  return [...active, ...resolved];
}

/** Vârsta cazului în zile rotunjite. */
export function caseAgeDays(
  c: Pick<ResqCaseWithReporter, 'created_at'>,
  now: Date = new Date()
): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(c.created_at).getTime()) / DAY_MS)
  );
}

/**
 * Cazul este „vechi" (activ de ≥ 30 zile) — candidat pentru repostare/
 * reamintire comunității.
 */
export const RESQ_STALE_DAYS = 30;
export function isCaseStale(
  c: Pick<ResqCaseWithReporter, 'status' | 'created_at'>,
  now: Date = new Date()
): boolean {
  return c.status === 'active' && caseAgeDays(c, now) >= RESQ_STALE_DAYS;
}

/** Contoare pe tip pentru sumar (active). */
export function countResqByType(
  cases: ResqCaseWithReporter[]
): Record<ResqType, number> {
  return {
    lost: cases.filter((c) => c.type === 'lost' && c.status === 'active').length,
    found: cases.filter((c) => c.type === 'found' && c.status === 'active').length,
  };
}

/** Cheia i18n pentru tipul cazului (fallback „other"-proof). */
export function resqTypeKey(type: string): ResqType {
  return type === 'found' ? 'found' : 'lost';
}

/** Statusul sigur (fallback la 'active'). */
export function resqStatusKey(status: string): ResqStatus {
  return status === 'resolved' ? 'resolved' : 'active';
}
