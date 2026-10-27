/**
 * Teste pentru utilitarele + validarea PetPlanner (pure, fără I/O).
 */
import {
  nextOccurrenceISO,
  plannerBucket,
  sortPlannerTasks,
  groupPlannerTasks,
  countOpenToday,
  startOfDay,
  endOfDay,
} from '../src/utils/planner';
import { PlannerTaskSchema, isoDatetime } from '../src/validation/planner';
import type { PlannerTask } from '../src/types/planner';

// ---- fabrică de task-uri ----
const OWNER = '11111111-1111-1111-1111-111111111111';
const PET = '22222222-2222-2222-2222-222222222222';

function makeTask(partial: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: '33333333-3333-3333-3333-333333333333',
    pet_id: PET,
    owner_id: OWNER,
    title: 'Hrană uscată',
    category: 'feeding',
    due_at: '2026-03-15T18:00:00.000Z',
    recurrence: 'none',
    done: false,
    created_at: '2026-03-01T10:00:00.000Z',
    ...partial,
  };
}

describe('planner — nextOccurrenceISO', () => {
  const now = new Date('2026-03-15T19:00:00.000Z');

  it('recurență none → null', () => {
    expect(nextOccurrenceISO('2026-03-15T18:00:00.000Z', 'none', now)).toBeNull();
  });

  it('daily → +1 zi, păstrează ora', () => {
    const next = nextOccurrenceISO('2026-03-15T08:00:00.000Z', 'daily', now)!;
    expect(new Date(next).toISOString()).toBe('2026-03-16T08:00:00.000Z');
  });

  it('weekly → +7 zile, păstrează ora', () => {
    const next = nextOccurrenceISO('2026-03-15T08:00:00.000Z', 'weekly', now)!;
    expect(new Date(next).toISOString()).toBe('2026-03-22T08:00:00.000Z');
  });

  it('termen întârziat (daily) → avansează până la primul termen viitor', () => {
    // due acum 3 zile, marcat done azi → următoarea aparție mâine la aceeași oră
    const overdue = '2026-03-12T08:00:00.000Z';
    const next = nextOccurrenceISO(overdue, 'daily', now)!;
    expect(new Date(next).toISOString()).toBe('2026-03-16T08:00:00.000Z');
  });

  it('termen întârziat (weekly) → avansează săptămânal până e viitor', () => {
    const overdue = '2026-02-01T08:00:00.000Z';
    const next = nextOccurrenceISO(overdue, 'weekly', now)!;
    const d = new Date(next);
    expect(d.getTime()).toBeGreaterThan(now.getTime());
    expect(d.toISOString()).toBe('2026-03-22T08:00:00.000Z');
  });

  it('dată invalidă → null (fără crash)', () => {
    expect(nextOccurrenceISO('not-a-date', 'daily', now)).toBeNull();
  });
});

describe('planner — plannerBucket', () => {
  const now = new Date('2026-03-15T15:00:00.000Z');

  it('done → bucket done', () => {
    expect(plannerBucket(makeTask({ done: true }), now)).toBe('done');
  });

  it('termen ieri → overdue', () => {
    expect(plannerBucket(makeTask({ due_at: '2026-03-14T10:00:00.000Z' }), now)).toBe('overdue');
  });

  it('termen azi la 23:00 (local) → today', () => {
    const d = endOfDay(now);
    expect(plannerBucket(makeTask({ due_at: d.toISOString() }), now)).toBe('today');
  });

  it('termen la miezul nopții locale (00:00 azi) → today', () => {
    const d = startOfDay(now);
    expect(plannerBucket(makeTask({ due_at: d.toISOString() }), now)).toBe('today');
  });

  it('termen săptămâna viitoare → upcoming', () => {
    expect(plannerBucket(makeTask({ due_at: '2026-03-22T10:00:00.000Z' }), now)).toBe('upcoming');
  });

  it('dată invalidă → upcoming (nu crash)', () => {
    expect(plannerBucket(makeTask({ due_at: 'garbage' }), now)).toBe('upcoming');
  });
});

describe('planner — sortPlannerTasks', () => {
  it('activate crescător după termen, finalizate la final', () => {
    const a = makeTask({ id: 'a', due_at: '2026-03-16T10:00:00.000Z' });
    const b = makeTask({ id: 'b', due_at: '2026-03-15T10:00:00.000Z' });
    const c = makeTask({ id: 'c', due_at: '2026-03-14T10:00:00.000Z', done: true });
    const d = makeTask({ id: 'd', due_at: '2026-03-13T10:00:00.000Z', done: true });
    const sorted = sortPlannerTasks([a, b, c, d]);
    expect(sorted.map((t) => t.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('finalizate: cea mai recentă primul', () => {
    const c1 = makeTask({ id: 'c1', due_at: '2026-03-10T10:00:00.000Z', done: true });
    const c2 = makeTask({ id: 'c2', due_at: '2026-03-12T10:00:00.000Z', done: true });
    const sorted = sortPlannerTasks([c1, c2]);
    expect(sorted.map((t) => t.id)).toEqual(['c2', 'c1']);
  });
});

describe('planner — groupPlannerTasks & countOpenToday', () => {
  const now = new Date('2026-03-15T15:00:00.000Z');

  it('grupează în ordinea overdue → today → upcoming → done', () => {
    const tasks = [
      makeTask({ id: 'up', due_at: '2026-03-22T10:00:00.000Z' }),
      makeTask({ id: 'today', due_at: endOfDay(now).toISOString() }),
      makeTask({ id: 'over', due_at: '2026-03-14T10:00:00.000Z' }),
      makeTask({ id: 'done', due_at: '2026-03-13T10:00:00.000Z', done: true }),
    ];
    const groups = groupPlannerTasks(tasks, now);
    expect(groups.map((g) => g.bucket)).toEqual(['overdue', 'today', 'upcoming', 'done']);
  });

  it('grupuri goale sunt eliminate', () => {
    const tasks = [makeTask({ id: 'today', due_at: endOfDay(now).toISOString() })];
    const groups = groupPlannerTasks(tasks, now);
    expect(groups).toHaveLength(1);
    expect(groups[0].bucket).toBe('today');
  });

  it('countOpenToday: overdue + today, fără done și fără upcoming', () => {
    const tasks = [
      makeTask({ id: '1', due_at: '2026-03-14T10:00:00.000Z' }), // overdue
      makeTask({ id: '2', due_at: endOfDay(now).toISOString() }), // today
      makeTask({ id: '3', due_at: '2026-03-22T10:00:00.000Z' }), // upcoming
      makeTask({ id: '4', due_at: '2026-03-14T10:00:00.000Z', done: true }), // done
    ];
    expect(countOpenToday(tasks, now)).toBe(2);
  });
});

describe('planner — PlannerTaskSchema (Zod)', () => {
  const valid = {
    pet_id: PET,
    title: 'Plimbare seara',
    category: 'walk',
    due_at: '2026-03-16T18:30:00.000Z',
    recurrence: 'none',
  };

  it('input valid trece', () => {
    const r = PlannerTaskSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('title trimite spațiile și respinge prea scurt', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, title: '  ab  ' }).success).toBe(true);
    expect(PlannerTaskSchema.safeParse({ ...valid, title: ' a ' }).success).toBe(false);
  });

  it('title > 80 caractere respins', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, title: 'x'.repeat(81) }).success).toBe(false);
  });

  it('categorie invalidă respinsă', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, category: 'party' }).success).toBe(false);
  });

  it('recurență invalidă respinsă', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, recurrence: 'hourly' }).success).toBe(false);
  });

  it('pet_id nu este UUID → respins', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, pet_id: 'abc' }).success).toBe(false);
  });

  it('due_at nu e dată → respins', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, due_at: 'demain' }).success).toBe(false);
  });

  it('due_at în afara intervalului 2000–2100 → respins', () => {
    expect(PlannerTaskSchema.safeParse({ ...valid, due_at: '2150-01-01T00:00:00.000Z' }).success).toBe(false);
    expect(PlannerTaskSchema.safeParse({ ...valid, due_at: '1999-01-01T00:00:00.000Z' }).success).toBe(false);
  });

  it('isoDatetime acceptă ISO cu offset (+03:00)', () => {
    expect(isoDatetime.safeParse('2026-03-16T20:30:00+03:00').success).toBe(true);
  });
});
