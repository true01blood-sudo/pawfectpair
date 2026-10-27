/** URL scheme pentru deep linking mobil */
export const APP_URL_SCHEME = 'pawfectpair';

/** Site-ul web companion (Next.js) — aceeași bază de date Supabase */
export const WEB_APP_URL = 'https://pawfectpair.app';

/**
 * Mapare modul mobil → pagină pe site-ul pawfectpair.app.
 * null = funcționalitate existentă doar în aplicația mobilă.
 */
export const WEB_MODULE_ROUTES: Record<string, string | null> = {
  petmatch: '/comunitate',
  petplanner: '/planificator',
  adoptii: '/adoptii',
  petguardian: null,        // doar mobil (GPS)
  petwell: '/animale',      // fișa medicală web
  petedu: '/educatie',
  petevents: null,
  petmarket: '/magazin',
  petconnect: '/comunitate',
  petday: null,             // doar mobil (faza curentă)
  pettraining: null,
  petsos: '/sos',
  petresq: '/resq',
  petinsurance: null,
  petanalytics: null,
  petlegacy: null,
};

/** URL-ul web pentru un modul, sau null dacă modulul e mobile-only. */
export function webModuleUrl(moduleId: string): string | null {
  const path = WEB_MODULE_ROUTES[moduleId];
  return path ? `${WEB_APP_URL}${path}` : null;
}

/** Bucket Supabase Storage pentru media publică */
export const STORAGE_BUCKET = 'public-media';

/** Configurare cache TanStack Query (conform secțiunii 6.4 din spec) */
export const QUERY_CACHE_CONFIG = {
  staleTime: 1000 * 60 * 5,        // 5 minute
  gcTime: 1000 * 60 * 60 * 24,     // 24 ore
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
} as const;

/** Limite brute-force protection (secțiunea 8.7) */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minute

/** Vârstă minimă pentru cont (GDPR, secțiunea 9.4) */
export const MIN_AGE_YEARS = 16;
