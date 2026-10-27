/**
 * Utilitare pure PetPlanner — grupare, sortare, recurență.
 * Toate funcțiile sunt pure (fără I/O) → testabile unitar.
 */
import type { PlannerBucket, PlannerRecurrence, PlannerTask } from '../types/planner';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
/** plafon de siguranță pentru avansarea recurențelor întârziate (anti-loop) */
const MAX_RECURRENCE_STEPS = 400;

/** Începutul zilei (ora locală 00:00:00.000) */
export function startOfDay(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Sfârșitul zilei (ora locală 23:59:59.999) */
export function endOfDay(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

/**
 * Următoarea apariție pentru o activitate recurentă.
 * Păstrează ora din zi a termenului original; dacă rezultatul e deja trecut
 * (activitate marcată done cu întârziere), avansează până la primul termen
 * viitor, cu plafon de siguranță MAX_RECURRENCE_STEPS pași.
 * `none` → null (fără recurență).
 */
export function nextOccurrenceISO(
  dueAt: string,
  recurrence: PlannerRecurrence,
  now: Date = new Date()
): string | null {
  if (recurrence === 'none') return null;
  const stepMs = recurrence === 'daily' ? DAY_MS : WEEK_MS;
  const base = new Date(dueAt);
  if (Number.isNaN(base.getTime())) return null;
  let next = new Date(base.getTime() + stepMs);
  let steps = 0;
  while (next.getTime() <= now.getTime() && steps < MAX_RECURRENCE_STEPS) {
    next = new Date(next.getTime() + stepMs);
    steps += 1;
  }
  return next.toISOString();
}

/**
 * Bucket-ul UI pentru o activitate, față de „acum":
 * done → 'done'; înainte de începutul zilei → 'overdue';
 * în cursul zilei de azi → 'today'; altfel → 'upcoming'.
 */
export function plannerBucket(task: PlannerTask, now: Date = new Date()): PlannerBucket {
  if (task.done) return 'done';
  const due = new Date(task.due_at);
  if (Number.isNaN(due.getTime())) return 'upcoming';
  if (due.getTime() < startOfDay(now).getTime()) return 'overdue';
  if (due.getTime() <= endOfDay(now).getTime()) return 'today';
  return 'upcoming';
}

/**
 * Sortare pentru listă: activate mai întâi, după termen crescător;
 * finalizate la final, după termen descrescător (cele mai recente primul).
 */
export function sortPlannerTasks(tasks: PlannerTask[]): PlannerTask[] {
  const open = tasks
    .filter((t) => !t.done)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  const done = tasks
    .filter((t) => t.done)
    .sort((a, b) => new Date(b.due_at).getTime() - new Date(a.due_at).getTime());
  return [...open, ...done];
}

/**
 * Grupare pe bucket-uri în ordinea afișării UI.
 * Returnează doar bucket-urile care au cel puțin o activitate.
 */
export function groupPlannerTasks(
  tasks: PlannerTask[],
  now: Date = new Date()
): Array<{ bucket: PlannerBucket; tasks: PlannerTask[] }> {
  const groups: Array<{ bucket: PlannerBucket; tasks: PlannerTask[] }> = [
    { bucket: 'overdue', tasks: [] },
    { bucket: 'today', tasks: [] },
    { bucket: 'upcoming', tasks: [] },
    { bucket: 'done', tasks: [] },
  ];
  for (const task of tasks) {
    const b = plannerBucket(task, now);
    groups.find((g) => g.bucket === b)?.tasks.push(task);
  }
  return groups.filter((g) => g.tasks.length > 0);
}

/** Numără activitățile de făcut „astăzi sau întârziate" (badge dashboard) */
export function countOpenToday(tasks: PlannerTask[], now: Date = new Date()): number {
  return tasks.filter((t) => {
    if (t.done) return false;
    const b = plannerBucket(t, now);
    return b === 'overdue' || b === 'today';
  }).length;
}
