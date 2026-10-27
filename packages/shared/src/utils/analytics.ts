/**
 * Utils PetAnalytics — analize predictive locale (fără API extern).
 * Regresie liniară pe greutate, rată de completare planner, activitate
 * antrenament, statisticile medicale și scor compozit de sănătate.
 * Totul e calculat pe dispozitiv — datele nu părăsesc aplicația.
 *
 * Testate unitar în packages/shared/__tests__/analytics.test.ts.
 */
import type { MedicalRecord, WeightLog } from '../types/medical';
import type { PlannerTask } from '../types/planner';
import type { TrainingSession } from '../types/training';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// ============================================================
// Regresie liniară (cele mai mici pătrate)
// ============================================================

export interface RegressionResult {
  slope: number;
  intercept: number;
  /** 0-1 — calitatea ajustării (1 = perfectă) */
  r2: number;
}

/** Regresie liniară simplă pe puncte (x, y). Returnează null pentru <2 puncte. */
export function linearRegression(points: { x: number; y: number }[]): RegressionResult | null {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2 };
}

// ============================================================
// Trend greutate
// ============================================================

export interface WeightTrend {
  /** 'up' | 'down' | 'stable' | 'insufficient' */
  direction: 'up' | 'down' | 'stable' | 'insufficient';
  /** kg / săptămână (negativ = slăbire) */
  weeklyChangeKg: number;
  /** calitatea ajustării 0-1 (null dacă insuficient) */
  confidence: number | null;
  /** predicție după `days` zile (kg) sau null */
  predictedAt: (days: number) => number | null;
  /** prima și ultima măsurătoare folosite */
  firstKg: number | null;
  lastKg: number | null;
}

/** Prag sub care trendul e considerat stabil: 0,1 kg/săptămână */
export const WEIGHT_STABLE_THRESHOLD = 0.1;
/** Minim de măsurători pentru o predicție credibilă */
export const WEIGHT_MIN_POINTS = 3;

/** Analiză trend din log-urile de greutate (ordonate cronologic intern). */
export function weightTrend(logs: WeightLog[]): WeightTrend {
  const sorted = [...logs]
    .filter((l) => typeof l.weight_kg === 'number' && l.weight_kg > 0)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const firstKg = sorted.length > 0 ? sorted[0].weight_kg : null;
  const lastKg = sorted.length > 0 ? sorted[sorted.length - 1].weight_kg : null;
  if (sorted.length < WEIGHT_MIN_POINTS) {
    return {
      direction: 'insufficient',
      weeklyChangeKg: 0,
      confidence: null,
      predictedAt: () => null,
      firstKg,
      lastKg,
    };
  }
  const t0 = new Date(sorted[0].measured_at).getTime();
  const points = sorted.map((l) => ({
    x: (new Date(l.measured_at).getTime() - t0) / DAY_MS,
    y: l.weight_kg,
  }));
  const reg = linearRegression(points);
  if (!reg) {
    return {
      direction: 'insufficient',
      weeklyChangeKg: 0,
      confidence: null,
      predictedAt: () => null,
      firstKg,
      lastKg,
    };
  }
  const weeklyChangeKg = Math.round(reg.slope * 7 * 100) / 100;
  const direction: WeightTrend['direction'] =
    weeklyChangeKg > WEIGHT_STABLE_THRESHOLD
      ? 'up'
      : weeklyChangeKg < -WEIGHT_STABLE_THRESHOLD
        ? 'down'
        : 'stable';
  return {
    direction,
    weeklyChangeKg,
    confidence: Math.round(reg.r2 * 100) / 100,
    predictedAt: (days: number) => {
      if (days < 0) return null;
      const x = points[points.length - 1].x + days;
      const y = reg.slope * x + reg.intercept;
      // Nu predicem valori neverosimilare (negative)
      return y > 0 ? Math.round(y * 100) / 100 : null;
    },
    firstKg,
    lastKg,
  };
}

// ============================================================
// Planner — rată de completare
// ============================================================

export interface PlannerStats {
  total: number;
  done: number;
  /** 0-100 (100 dacă nu există task-uri) */
  rate: number;
  /** task-uri făcute în ultimele `days` zile */
  doneRecent: number;
  open: number;
}

/** Statistici completare din task-urile plannerului (ferestre de `days` zile, pe due_at). */
export function plannerStats(tasks: PlannerTask[], days = 30, now: Date = new Date()): PlannerStats {
  const from = now.getTime() - days * DAY_MS;
  const doneRecent = tasks.filter(
    (t) =>
      t.done &&
      new Date(t.due_at).getTime() >= from
  ).length;
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return {
    total,
    done,
    rate: total === 0 ? 100 : Math.round((done / total) * 100),
    doneRecent,
    open: total - done,
  };
}

// ============================================================
// Antrenament — activitate
// ============================================================

export interface TrainingStats {
  sessions7: number;
  sessions30: number;
  minutes7: number;
  minutes30: number;
  /** medii sesiuni/săptămână din ultimele 4 săptămâni */
  avgPerWeek4w: number;
}

export function trainingStats(sessions: TrainingSession[], now: Date = new Date()): TrainingStats {
  const inRange = (d: number) => {
    const from = now.getTime() - d * DAY_MS;
    return sessions.filter((s) => new Date(s.practiced_at).getTime() >= from);
  };
  const s7 = inRange(7);
  const s30 = inRange(30);
  const weeks = 4;
  const from4w = now.getTime() - weeks * WEEK_MS;
  const s4w = sessions.filter((s) => new Date(s.practiced_at).getTime() >= from4w);
  return {
    sessions7: s7.length,
    sessions30: s30.length,
    minutes7: s7.reduce((sum, s) => sum + s.duration_minutes, 0),
    minutes30: s30.reduce((sum, s) => sum + s.duration_minutes, 0),
    avgPerWeek4w: Math.round((s4w.length / weeks) * 10) / 10,
  };
}

// ============================================================
// Medical — frecvență & următoare evenimente
// ============================================================

export interface MedicalStats {
  /** înregistrări în ultimele 90 zile */
  last90: number;
  /** înregistrări viitoare (due_date peste azi) */
  upcoming: number;
  /** zile de la ultima înregistrare (null dacă nimic) */
  daysSinceLast: number | null;
  /** cel mai frecvent tip */
  topType: string | null;
}

export function medicalStats(records: MedicalRecord[], now: Date = new Date()): MedicalStats {
  const from = now.getTime() - 90 * DAY_MS;
  const dated = records.filter((r) => r.record_date);
  const last90 = dated.filter((r) => new Date(`${r.record_date}T00:00:00Z`).getTime() >= from).length;
  const upcoming = dated.filter(
    (r) => r.due_date && new Date(`${r.due_date}T00:00:00Z`).getTime() > now.getTime()
  ).length;
  const last = dated.reduce<string | null>((acc, r) => {
    if (!acc || r.record_date > acc) return r.record_date;
    return acc;
  }, null);
  const daysSinceLast = last
    ? Math.floor((now.getTime() - new Date(`${last}T00:00:00Z`).getTime()) / DAY_MS)
    : null;
  const counts: Record<string, number> = {};
  for (const r of dated) counts[r.type] = (counts[r.type] ?? 0) + 1;
  const topType =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { last90, upcoming, daysSinceLast, topType };
}

// ============================================================
// Scor compozit de sănătate (0-100)
// ============================================================

export interface HealthScoreInput {
  planner: PlannerStats;
  training: TrainingStats;
  medical: MedicalStats;
  weight: WeightTrend;
}

export interface HealthScorePart {
  score: number;   // 0-100 contribuția componentei
  max: number;     // ponderea maximă
  label: string;
}

export interface HealthScore {
  total: number;
  parts: HealthScorePart[];
}

/**
 * Scor compozit transparent:
 *  - Planner 30p: rată de completare
 *  - Antrenament 25p: minute în ultimele 7 zile (plafon 60 min)
 *  - Greutate 25p: stabilitate / trend moderat + date suficiente
 *  - Medical 20p: 90 - min(90, zile de la ultima înregistrare)
 */
export function healthScore(input: HealthScoreInput): HealthScore {
  // Fără task-uri deloc → nu presupunem complianță perfectă
  const plannerPart = input.planner.total === 0 ? 0 : Math.round((input.planner.rate / 100) * 30);
  const trainingPart = Math.min(25, Math.round((input.training.minutes7 / 60) * 25));
  let weightPart = 0;
  if (input.weight.direction === 'stable') weightPart = 25;
  else if (input.weight.direction === 'up' || input.weight.direction === 'down') weightPart = 15;
  else if (input.weight.direction === 'insufficient' && input.weight.lastKg != null) weightPart = 10;
  const medicalPart =
    input.medical.daysSinceLast == null
      ? 0
      : Math.round((Math.max(0, 90 - Math.min(90, input.medical.daysSinceLast)) / 90) * 20);
  return {
    total: plannerPart + trainingPart + weightPart + medicalPart,
    parts: [
      { score: plannerPart, max: 30, label: 'planner' },
      { score: trainingPart, max: 25, label: 'training' },
      { score: weightPart, max: 25, label: 'weight' },
      { score: medicalPart, max: 20, label: 'medical' },
    ],
  };
}

/** Etichetă pentru scor: low / medium / good / great. */
export function healthScoreLevel(total: number): 'low' | 'medium' | 'good' | 'great' {
  if (total >= 80) return 'great';
  if (total >= 60) return 'good';
  if (total >= 35) return 'medium';
  return 'low';
}
