/**
 * Modul PetWell — motor de TRIAJ simptome („asistent AI de sănătate").
 *
 * Important: aceasta NU este un diagnostic medical. Motorul e o funcție
 * pură, deterministă, bazată pe reguli veterinare generale de triaj:
 *   - greutăți pe simptom + reguli de ESCALADARE pentru combinații
 *     periculoase (ex: vărsături + letargie → urgent);
 *   - semne de alarmă roșii (ex: sânge în vărsături, convulsii, colaps)
 *     trec direct pe nivel EMERGENCY, indiferent de restul selecției.
 * Niveluri: emergency (roșu) / urgent (portocaliu) / monitor (galben) / calm (verde).
 */

export type TriageLevel = 'emergency' | 'urgent' | 'monitor' | 'calm';

export type SymptomCategory =
  | 'general'
  | 'digestive'
  | 'respiratory'
  | 'skin'
  | 'urinary'
  | 'behavior';

export interface Symptom {
  id: string;
  category: SymptomCategory;
  /** cheie i18n: petwell.sym_{id} */
  emoji: string;
  /** greutatea în scorul de risc (0–10) */
  weight: number;
  /** semn de alarmă — duce direct la EMERGENCY */
  redFlag?: boolean;
}

export interface TriageResult {
  level: TriageLevel;
  /** scor brut 0–100, pentru afișare */
  score: number;
  /** chei i18n pentru recomandări (petwell.advice_*) */
  adviceKeys: string[];
  /** simptomele red-flag selectate (pentru mesajul de urgență) */
  redFlags: string[];
}

/** Catalog simptome (id-uri stabile; label-uri în i18n) */
export const SYMPTOMS: Symptom[] = [
  // general
  { id: 'lethargy', category: 'general', emoji: '🥱', weight: 6 },
  { id: 'fever', category: 'general', emoji: '🌡️', weight: 6 },
  { id: 'pain', category: 'general', emoji: '😖', weight: 7 },
  { id: 'appetite_loss', category: 'general', emoji: '🍽️', weight: 4 },
  { id: 'thirst_excess', category: 'general', emoji: '💧', weight: 3 },
  // digestive
  { id: 'vomiting', category: 'digestive', emoji: '🤮', weight: 5 },
  { id: 'diarrhea', category: 'digestive', emoji: '💩', weight: 4 },
  { id: 'blood_vomit', category: 'digestive', emoji: '🩸', weight: 10, redFlag: true },
  { id: 'blood_stool', category: 'digestive', emoji: '🩸', weight: 9, redFlag: true },
  { id: 'bloated_abdomen', category: 'digestive', emoji: '🎈', weight: 8 },
  // respiratory
  { id: 'cough', category: 'respiratory', emoji: '😷', weight: 4 },
  { id: 'breathing_hard', category: 'respiratory', emoji: '😮‍💨', weight: 9, redFlag: true },
  { id: 'sneezing', category: 'respiratory', emoji: '🤧', weight: 2 },
  // skin
  { id: 'itching', category: 'skin', emoji: '🐾', weight: 2 },
  { id: 'hair_loss', category: 'skin', emoji: '🪶', weight: 2 },
  { id: 'wound', category: 'skin', emoji: '🩹', weight: 5 },
  { id: 'swelling', category: 'skin', emoji: '💠', weight: 5 },
  // urinary
  { id: 'urination_pain', category: 'urinary', emoji: '😖', weight: 7 },
  { id: 'no_urination', category: 'urinary', emoji: '🚫', weight: 10, redFlag: true },
  { id: 'blood_urine', category: 'urinary', emoji: '🩸', weight: 8 },
  // behavior
  { id: 'seizure', category: 'behavior', emoji: '⚡', weight: 10, redFlag: true },
  { id: 'disorientation', category: 'behavior', emoji: '🌀', weight: 7 },
  { id: 'aggression', category: 'behavior', emoji: '😠', weight: 3 },
  { id: 'hiding', category: 'behavior', emoji: '🫥', weight: 2 },
];

/** Reguli de escaladare pentru combinații (toate prezente → nivel minim dat) */
const COMBO_RULES: Array<{ ids: string[]; minLevel: TriageLevel }> = [
  { ids: ['vomiting', 'lethargy'], minLevel: 'urgent' },
  { ids: ['vomiting', 'diarrhea'], minLevel: 'urgent' },
  { ids: ['diarrhea', 'blood_stool'], minLevel: 'emergency' },
  { ids: ['appetite_loss', 'lethargy'], minLevel: 'urgent' },
  { ids: ['vomiting', 'bloated_abdomen'], minLevel: 'emergency' }, // posibilă torsiune gastrică
  { ids: ['thirst_excess', 'urination_pain'], minLevel: 'urgent' },
  { ids: ['fever', 'cough'], minLevel: 'urgent' },
];

const LEVEL_ORDER: Record<TriageLevel, number> = {
  calm: 0,
  monitor: 1,
  urgent: 2,
  emergency: 3,
};

/** Nivelul minim admis: cel cu prioritate mai mare din (scor, reguli). */
export function triageSymptoms(selectedIds: string[]): TriageResult {
  const selected = SYMPTOMS.filter((s) => selectedIds.includes(s.id));
  if (selected.length === 0) {
    return { level: 'calm', score: 0, adviceKeys: ['advice_none'], redFlags: [] };
  }

  const redFlags = selected.filter((s) => s.redFlag).map((s) => s.id);

  // scor simplu și predictibil: suma greutăților × 5, plafon 100.
  // Calibrare: simptom ușor (2-3) → monitor; moderat (5-7) → urgent;
  // red-flag (9-10) → emergency (prin regulă, nu prin scor).
  const sum = selected.reduce((acc, s) => acc + s.weight, 0);
  const score = Math.min(100, sum * 5);

  // 1) red flags → EMERGENCY direct
  let level: TriageLevel = 'calm';
  if (redFlags.length > 0) {
    level = 'emergency';
  } else {
    // 2) scor
    if (score >= 30) level = 'urgent';
    else if (score >= 10) level = 'monitor';
    // 3) reguli de combinație — pot RIDICA nivelul
    for (const rule of COMBO_RULES) {
      if (rule.ids.every((id) => selectedIds.includes(id))) {
        if (LEVEL_ORDER[rule.minLevel] > LEVEL_ORDER[level]) level = rule.minLevel;
      }
    }
  }

  // recomandări per nivel
  const adviceKeys: Record<TriageLevel, string[]> = {
    emergency: ['advice_emergency_1', 'advice_emergency_2', 'advice_emergency_3'],
    urgent: ['advice_urgent_1', 'advice_urgent_2', 'advice_urgent_3'],
    monitor: ['advice_monitor_1', 'advice_monitor_2', 'advice_monitor_3'],
    calm: ['advice_calm_1', 'advice_calm_2'],
  };

  return { level, score, adviceKeys: adviceKeys[level], redFlags };
}

/** Sugerează dacă animalul ar trebui dus la veterinar pe baza vârstei (ani). */
export function ageRiskHint(ageYears: number | null | undefined): 'senior' | 'young' | null {
  if (ageYears == null || Number.isNaN(ageYears)) return null;
  if (ageYears >= 8) return 'senior';
  if (ageYears < 1) return 'young';
  return null;
}
