/**
 * Teste PetAnalytics — regresie, trend greutate, planner, training, medical, scor.
 */
import {
  linearRegression,
  weightTrend,
  WEIGHT_MIN_POINTS,
  WEIGHT_STABLE_THRESHOLD,
  plannerStats,
  trainingStats,
  medicalStats,
  healthScore,
  healthScoreLevel,
} from '../src/utils/analytics';
import type { WeightLog, MedicalRecord } from '../src/types/medical';
import type { PlannerTask } from '../src/types/planner';
import type { TrainingSession } from '../src/types/training';

const NOW = new Date('2026-06-15T10:00:00Z');

function dayISO(offsetDays: number): string {
  return new Date(NOW.getTime() + offsetDays * 86400000).toISOString().slice(0, 10);
}

function makeLog(kg: number, dayOffset: number): WeightLog {
  return {
    id: `w${dayOffset}`,
    pet_id: 'p1',
    weight_kg: kg,
    measured_at: dayISO(dayOffset),
    notes: null,
    created_at: dayISO(dayOffset),
  };
}

function makeTask(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: 't1',
    pet_id: 'p1',
    owner_id: 'u1',
    title: 'Plimbare',
    category: 'walk',
    due_at: '2026-06-14T09:00:00Z',
    recurrence: 'none',
    done: false,
    created_at: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

function makeSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 's1',
    skill_id: 'sk1',
    pet_id: 'p1',
    user_id: 'u1',
    duration_minutes: 10,
    rating: 4,
    notes: null,
    practiced_at: '2026-06-14T09:00:00Z',
    created_at: '2026-06-14T09:00:00Z',
    ...overrides,
  };
}

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: 'r1',
    pet_id: 'p1',
    type: 'vaccine',
    title: 'Vaccin anual',
    record_date: '2026-06-01',
    due_date: null,
    notes: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('linearRegression', () => {
  it('linie perfectă: slope și r2 = 1', () => {
    const r = linearRegression([
      { x: 0, y: 10 },
      { x: 1, y: 11 },
      { x: 2, y: 12 },
    ]);
    expect(r).not.toBeNull();
    expect(r!.slope).toBeCloseTo(1);
    expect(r!.r2).toBeCloseTo(1);
  });

  it('null pentru < 2 puncte', () => {
    expect(linearRegression([{ x: 1, y: 1 }])).toBeNull();
  });

  it('x identice → null (denominator 0)', () => {
    expect(linearRegression([
      { x: 5, y: 1 },
      { x: 5, y: 2 },
    ])).toBeNull();
  });

  it('slope negativ pentru scădere', () => {
    const r = linearRegression([
      { x: 0, y: 20 },
      { x: 10, y: 10 },
    ]);
    expect(r!.slope).toBeLessThan(0);
  });
});

describe('weightTrend', () => {
  it('insufficient sub 3 măsurători', () => {
    const t = weightTrend([makeLog(10, -10), makeLog(10.2, -5)]);
    expect(t.direction).toBe('insufficient');
    expect(t.predictedAt(30)).toBeNull();
    expect(WEIGHT_MIN_POINTS).toBe(3);
  });

  it('detectează creștere stabilă', () => {
    const t = weightTrend([
      makeLog(10, -21),
      makeLog(10.5, -14),
      makeLog(11, -7),
      makeLog(11.5, 0),
    ]);
    expect(t.direction).toBe('up');
    expect(t.weeklyChangeKg).toBeCloseTo(0.5, 1);
    expect(t.confidence).toBeGreaterThan(0.9);
  });

  it('detectează scădere', () => {
    const t = weightTrend([
      makeLog(30, -21),
      makeLog(29, -14),
      makeLog(28, -7),
      makeLog(27, 0),
    ]);
    expect(t.direction).toBe('down');
  });

  it('stable sub prag', () => {
    const t = weightTrend([
      makeLog(10, -21),
      makeLog(10.02, -14),
      makeLog(9.98, -7),
      makeLog(10.01, 0),
    ]);
    expect(t.direction).toBe('stable');
    expect(Math.abs(t.weeklyChangeKg)).toBeLessThanOrEqual(WEIGHT_STABLE_THRESHOLD);
  });

  it('predicție la +30 zile pe linie perfectă', () => {
    const t = weightTrend([
      makeLog(10, -21),
      makeLog(10.5, -14),
      makeLog(11, -7),
      makeLog(11.5, 0),
    ]);
    const pred = t.predictedAt(30);
    expect(pred).not.toBeNull();
    expect(pred!).toBeGreaterThan(11.5);
  });

  it('nu predictează valori negative', () => {
    const t = weightTrend([
      makeLog(1, -21),
      makeLog(0.7, -14),
      makeLog(0.4, -7),
      makeLog(0.1, 0),
    ]);
    const pred = t.predictedAt(120);
    if (pred !== null) expect(pred).toBeGreaterThan(0);
  });

  it('filtrează greutăți invalide', () => {
    const t = weightTrend([
      makeLog(0, -21),
      makeLog(10, -14),
      makeLog(10.1, -7),
      makeLog(10.2, 0),
    ]);
    expect(t.firstKg).toBe(10);
  });
});

describe('plannerStats', () => {
  it('rată simplă', () => {
    const tasks = [
      makeTask({ id: '1', done: true }),
      makeTask({ id: '2', done: true }),
      makeTask({ id: '3', done: false }),
    ];
    const s = plannerStats(tasks, 30, NOW);
    expect(s.total).toBe(3);
    expect(s.done).toBe(2);
    expect(s.rate).toBe(67);
    expect(s.open).toBe(1);
  });

  it('100% fără task-uri', () => {
    expect(plannerStats([], 30, NOW).rate).toBe(100);
  });

  it('doneRecent doar în fereastră', () => {
    const tasks = [
      makeTask({ id: '1', done: true, due_at: '2026-06-14T00:00:00Z' }),
      makeTask({ id: '2', done: true, due_at: '2026-04-01T00:00:00Z' }),
    ];
    const s = plannerStats(tasks, 30, NOW);
    expect(s.doneRecent).toBe(1);
  });
});

describe('trainingStats', () => {
  it('agreghează sesiunile pe ferestre', () => {
    const sessions = [
      makeSession({ duration_minutes: 15, practiced_at: '2026-06-14T09:00:00Z' }),
      makeSession({ duration_minutes: 20, practiced_at: '2026-06-12T09:00:00Z' }),
      makeSession({ duration_minutes: 10, practiced_at: '2026-05-20T09:00:00Z' }),
    ];
    const s = trainingStats(sessions, NOW);
    expect(s.sessions7).toBe(2);
    expect(s.sessions30).toBe(3);
    expect(s.minutes7).toBe(35);
    expect(s.minutes30).toBe(45);
    expect(s.avgPerWeek4w).toBeCloseTo(0.8, 1);
  });
});

describe('medicalStats', () => {
  it('numără și calculează zile de la ultima', () => {
    const records = [
      makeRecord({ id: '1', record_date: '2026-06-10', type: 'vaccine' }),
      makeRecord({ id: '2', record_date: '2026-03-01', type: 'visit', due_date: '2026-09-01' }),
    ];
    const s = medicalStats(records, NOW);
    expect(s.last90).toBe(1);
    expect(s.upcoming).toBe(1);
    expect(s.daysSinceLast).toBe(5);
    expect(s.topType).toBe('vaccine');
  });

  it('null fără înregistrări', () => {
    const s = medicalStats([], NOW);
    expect(s.daysSinceLast).toBeNull();
    expect(s.topType).toBeNull();
  });
});

describe('healthScore', () => {
  it('scor maxim pentru date excelente', () => {
    const tasks = [makeTask({ done: true }), makeTask({ id: '2', done: true })];
    const score = healthScore({
      planner: plannerStats(tasks, 30, NOW),
      training: trainingStats([makeSession({ duration_minutes: 60 })], NOW),
      medical: medicalStats([makeRecord({ record_date: '2026-06-14' })], NOW),
      weight: weightTrend([
        makeLog(10, -21),
        makeLog(10.01, -14),
        makeLog(9.99, -7),
        makeLog(10, 0),
      ]),
    });
    expect(score.total).toBe(100);
    expect(score.parts).toHaveLength(4);
  });

  it('scor 0 fără date', () => {
    const score = healthScore({
      planner: plannerStats([], 30, NOW),
      training: trainingStats([], NOW),
      medical: medicalStats([], NOW),
      weight: weightTrend([]),
    });
    expect(score.total).toBe(0);
  });

  it('niveluri corecte', () => {
    expect(healthScoreLevel(95)).toBe('great');
    expect(healthScoreLevel(70)).toBe('good');
    expect(healthScoreLevel(40)).toBe('medium');
    expect(healthScoreLevel(10)).toBe('low');
  });
});
