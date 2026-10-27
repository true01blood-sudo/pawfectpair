/**
 * Registru central al tuturor modulelor Pet Care Services.
 * Fiecare modul are: id, iconiță, cheie i18n, fază, rută (sau null pentru coming soon).
 * Conform planului complet (Parte scrisa + Module PDF).
 */
import type { Ionicons } from '@expo/vector-icons';

export type ModulePhase = 1 | 2 | 3;

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
}

export const MODULES: AppModule[] = [
  // ===== FAZA 1 — COMPLETĂ (PetMatch + PetPlanner + Adopții: LIVE) =====
  { id: 'petmatch', icon: 'heart', emoji: '❤️', nameKey: 'petmatchName', descKey: 'petmatchDesc', phase: 1, route: '/(tabs)/petmatch', color: '#EF4444', status: 'live' },
  { id: 'petplanner', icon: 'calendar', emoji: '📅', nameKey: 'petplannerName', descKey: 'petplannerDesc', phase: 1, route: '/modul/petplanner', color: '#0EA5E9', status: 'live' },
  { id: 'adoptii', icon: 'paw', emoji: '🏠', nameKey: 'adoptiiName', descKey: 'adoptiiDesc', phase: 1, route: '/modul/adoptii', color: '#10B981', status: 'live' },

  // ===== FAZA 2 — în dezvoltare (LIVE: PetGuardian, PetWell, PetSOS, PetEdu) =====
  { id: 'petguardian', icon: 'location', emoji: '📡', nameKey: 'petguardianName', descKey: 'petguardianDesc', phase: 2, route: '/modul/petguardian', color: '#3B82F6', status: 'live' },
  { id: 'petwell', icon: 'medkit', emoji: '🩺', nameKey: 'petwellName', descKey: 'petwellDesc', phase: 2, route: '/modul/petwell', color: '#16A34A', status: 'live' },
  { id: 'petedu', icon: 'book', emoji: '📚', nameKey: 'peteduName', descKey: 'peteduDesc', phase: 2, route: '/modul/petedu', color: '#8B5CF6', status: 'live' },
  { id: 'petevents', icon: 'calendar-number', emoji: '🎪', nameKey: 'peteventsName', descKey: 'peteventsDesc', phase: 2, route: '/modul/petevents', color: '#F59E0B', status: 'live' },
  { id: 'petmarket', icon: 'cart', emoji: '🛍️', nameKey: 'petmarketName', descKey: 'petmarketDesc', phase: 2, route: '/modul/petmarket', color: '#EC4899', status: 'live' },
  { id: 'petconnect', icon: 'people', emoji: '👥', nameKey: 'petconnectName', descKey: 'petconnectDesc', phase: 2, route: '/modul/petconnect', color: '#06B6D4', status: 'live' },
  { id: 'petday', icon: 'bed', emoji: '🏡', nameKey: 'petdayName', descKey: 'petdayDesc', phase: 2, route: '/modul/petday', color: '#14B8A6', status: 'live' },
  { id: 'pettraining', icon: 'fitness', emoji: '🎓', nameKey: 'pettrainingName', descKey: 'pettrainingDesc', phase: 2, route: '/modul/pettraining', color: '#F97316', status: 'live' },
  { id: 'petsos', icon: 'warning', emoji: '🆘', nameKey: 'petsosName', descKey: 'petsosDesc', phase: 2, route: '/modul/petsos', color: '#DC2626', status: 'live' },
  { id: 'petresq', icon: 'search', emoji: '🔍', nameKey: 'petresqName', descKey: 'petresqDesc', phase: 2, route: '/modul/petresq', color: '#84CC16', status: 'live' },
  { id: 'petinsurance', icon: 'shield-checkmark', emoji: '🛡️', nameKey: 'petinsuranceName', descKey: 'petinsuranceDesc', phase: 2, route: '/modul/petinsurance', color: '#0F766E', status: 'live' },

  // ===== MODULE NOI FAZA 1/2 =====
  { id: 'petbreeding', icon: 'flower', emoji: '🌸', nameKey: 'petbreedingName', descKey: 'petbreedingDesc', phase: 1, route: '/modul/petbreeding', color: '#EC4899', status: 'live' },
  { id: 'petpassport', icon: 'airplane', emoji: '✈️', nameKey: 'petpassportName', descKey: 'petpassportDesc', phase: 2, route: '/modul/petpassport', color: '#3B82F6', status: 'live' },

  // ===== FAZA 3 — planificate =====
  { id: 'petanalytics', icon: 'stats-chart', emoji: '📊', nameKey: 'petanalyticsName', descKey: 'petanalyticsDesc', phase: 3, route: '/modul/petanalytics', color: '#6366F1', status: 'live' },
  { id: 'petlegacy', icon: 'flower', emoji: '🌷', nameKey: 'petlegacyName', descKey: 'petlegacyDesc', phase: 3, route: '/modul/petlegacy', color: '#A855F7', status: 'live' },
];

export function getModulesByPhase(phase: ModulePhase): AppModule[] {
  return MODULES.filter((m) => m.phase === phase);
}

export function getModuleById(id: string): AppModule | undefined {
  return MODULES.find((m) => m.id === id);
}
