/**
 * Registru central al tuturor modulelor Pet Care Services.
 * Fiecare modul are: id, iconiță, cheie i18n, fază, rută (sau null pentru coming soon).
 * Conform planului complet (Parte scrisa + Module PDF).
 */
import type { Ionicons } from '@expo/vector-icons';

export type ModulePhase = 1 | 2 | 3;
export type ModuleTier = 'free' | 'premium';

export interface AppModule {
  id: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap | string;
  emoji: string;
  nameKey: string;       // i18n key: modules.{id}Name
  descKey: string;       // i18n key: modules.{id}Desc
  phase: ModulePhase;
  /** Rută Expo Router (relativă). null = coming soon */
  route: string | null;
  /** Culoare accent pentru card (override tema) */
  color: string;
  /** 'live' = implementat & accesibil; lipsă = coming soon (badge fază) */
  status?: 'live' | 'dev';
  /**
   * Nivel de acces (decis cu userul): 'free' = SOS, Adopții, Magazin,
   * PetWell, PetMatch — module fără cost mare de întreținere sau care au
   * nevoie de masă critică de useri ca să aibă valoare (Adopții/PetMatch).
   * 'premium' = restul (19,99€/an, sau gratuit prin promoția de lansare
   * pentru cei inregistrati pana la 30 dec 2026, expira cel tarziu 1 iun 2027).
   */
  tier: ModuleTier;
}

export const MODULES: AppModule[] = [
  // ===== FAZA 1 — COMPLETĂ (PetMatch + PetPlanner + Adopții: LIVE) =====
  { id: 'petmatch', icon: 'heart', emoji: '❤️', nameKey: 'petmatchName', descKey: 'petmatchDesc', phase: 1, route: '/(tabs)/petmatch', color: '#EF4444', status: 'live', tier: 'free' },
  { id: 'petplanner', icon: 'calendar', emoji: '📅', nameKey: 'petplannerName', descKey: 'petplannerDesc', phase: 1, route: '/modul/petplanner', color: '#0EA5E9', status: 'live', tier: 'premium' },
  { id: 'adoptii', icon: 'paw', emoji: '🏠', nameKey: 'adoptiiName', descKey: 'adoptiiDesc', phase: 1, route: '/modul/adoptii', color: '#10B981', status: 'live', tier: 'free' },

  // ===== FAZA 1 — TOATE MODULELE LIVE =====
  { id: 'petguardian', icon: 'location', emoji: '📡', nameKey: 'petguardianName', descKey: 'petguardianDesc', phase: 1, route: '/modul/petguardian', color: '#3B82F6', status: 'live', tier: 'premium' },
  { id: 'petwell', icon: 'medkit', emoji: '🩺', nameKey: 'petwellName', descKey: 'petwellDesc', phase: 1, route: '/modul/petwell', color: '#16A34A', status: 'live', tier: 'free' },
  { id: 'petedu', icon: 'book', emoji: '📚', nameKey: 'peteduName', descKey: 'peteduDesc', phase: 1, route: '/modul/petedu', color: '#8B5CF6', status: 'live', tier: 'premium' },
  { id: 'petevents', icon: 'calendar-number', emoji: '🎪', nameKey: 'peteventsName', descKey: 'peteventsDesc', phase: 1, route: '/modul/petevents', color: '#F59E0B', status: 'live', tier: 'premium' },
  { id: 'petmarket', icon: 'cart', emoji: '🛍️', nameKey: 'petmarketName', descKey: 'petmarketDesc', phase: 1, route: '/modul/petmarket', color: '#EC4899', status: 'live', tier: 'free' },
  { id: 'petconnect', icon: 'people', emoji: '👥', nameKey: 'petconnectName', descKey: 'petconnectDesc', phase: 1, route: '/modul/petconnect', color: '#06B6D4', status: 'live', tier: 'premium' },
  { id: 'petday', icon: 'bed', emoji: '🏡', nameKey: 'petdayName', descKey: 'petdayDesc', phase: 1, route: '/modul/petday', color: '#14B8A6', status: 'live', tier: 'premium' },
  { id: 'pettraining', icon: 'fitness', emoji: '🎓', nameKey: 'pettrainingName', descKey: 'pettrainingDesc', phase: 1, route: '/modul/pettraining', color: '#F97316', status: 'live', tier: 'premium' },
  { id: 'petsos', icon: 'warning', emoji: '🆘', nameKey: 'petsosName', descKey: 'petsosDesc', phase: 1, route: '/modul/petsos', color: '#DC2626', status: 'live', tier: 'free' },
  { id: 'petresq', icon: 'search', emoji: '🔍', nameKey: 'petresqName', descKey: 'petresqDesc', phase: 1, route: '/modul/petresq', color: '#84CC16', status: 'live', tier: 'premium' },
  { id: 'petinsurance', icon: 'shield-checkmark', emoji: '🛡️', nameKey: 'petinsuranceName', descKey: 'petinsuranceDesc', phase: 1, route: '/modul/petinsurance', color: '#0F766E', status: 'live', tier: 'premium' },
  { id: 'petbreeding', icon: 'flower', emoji: '🌸', nameKey: 'petbreedingName', descKey: 'petbreedingDesc', phase: 1, route: '/modul/petbreeding', color: '#EC4899', status: 'live', tier: 'premium' },
  { id: 'petpassport', icon: 'airplane', emoji: '✈️', nameKey: 'petpassportName', descKey: 'petpassportDesc', phase: 1, route: '/modul/petpassport', color: '#3B82F6', status: 'live', tier: 'premium' },
  { id: 'petanalytics', icon: 'stats-chart', emoji: '📊', nameKey: 'petanalyticsName', descKey: 'petanalyticsDesc', phase: 1, route: '/modul/petanalytics', color: '#6366F1', status: 'live', tier: 'premium' },
  { id: 'petlegacy', icon: 'flower', emoji: '🌷', nameKey: 'petlegacyName', descKey: 'petlegacyDesc', phase: 1, route: '/modul/petlegacy', color: '#A855F7', status: 'live', tier: 'premium' },

  // ===== FAZA 2/3 — placeholder pentru module viitoare =====
];

export function getModulesByPhase(phase: ModulePhase): AppModule[] {
  return MODULES.filter((m) => m.phase === phase);
}

export function getModuleById(id: string): AppModule | undefined {
  return MODULES.find((m) => m.id === id);
}
