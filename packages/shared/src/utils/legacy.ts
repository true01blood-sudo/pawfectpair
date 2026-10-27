/**
 * Utils PetLegacy — funcții pure pentru completitudine plan și memorii.
 * Testate unitar în packages/shared/__tests__/legacy.test.ts.
 */
import type {
  LegacyChecklistItem,
  LegacyPlan,
  PetMemorial,
} from '../types/legacy';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Checklist completitudine plan (5 componente). */
export function planChecklist(plan: LegacyPlan): LegacyChecklistItem[] {
  return [
    { key: 'guardian', done: !!plan.guardian_name },
    { key: 'phone', done: !!plan.guardian_phone || !!plan.guardian_email },
    { key: 'instructions', done: !!plan.instructions },
    { key: 'budget', done: plan.care_budget_cents != null && plan.care_budget_cents >= 0 },
    { key: 'wishes', done: !!plan.wishes },
  ];
}

/** Completitudine plan 0-100 (guardian 35, contact 15, instrucțiuni 25, buget 10, dorințe 15). */
export function planCompleteness(plan: LegacyPlan): number {
  const weights: Record<LegacyChecklistItem['key'], number> = {
    guardian: 35,
    phone: 15,
    instructions: 25,
    budget: 10,
    wishes: 15,
  };
  return planChecklist(plan).reduce((sum, item) => (item.done ? sum + weights[item.key] : sum), 0);
}

/** Planul e suficient de complet pentru a fi considerat „gata" (≥ 90%). */
export const LEGACY_READY_THRESHOLD = 90;
export function isPlanReady(plan: LegacyPlan): boolean {
  return planCompleteness(plan) >= LEGACY_READY_THRESHOLD;
}

/** Zile de la trecerea în neființă. */
export function daysSincePassed(
  memorial: Pick<PetMemorial, 'passed_at'>,
  now: Date = new Date()
): number {
  return Math.max(
    0,
    Math.floor(
      (now.getTime() - new Date(`${memorial.passed_at}T00:00:00Z`).getTime()) / DAY_MS
    )
  );
}

/** Zile până la următoarea aniversare (0 = azi). */
export function daysToAnniversary(
  memorial: Pick<PetMemorial, 'passed_at'>,
  now: Date = new Date()
): number {
  const passed = new Date(`${memorial.passed_at}T00:00:00Z`);
  const now0 = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  let next = new Date(
    Date.UTC(now0.getUTCFullYear(), passed.getUTCMonth(), passed.getUTCDate())
  );
  if (next.getTime() < now0.getTime()) {
    next = new Date(
      Date.UTC(now0.getUTCFullYear() + 1, passed.getUTCMonth(), passed.getUTCDate())
    );
  }
  return Math.round((next.getTime() - now0.getTime()) / DAY_MS);
}

/** Sortare memorii: cele mai recente treceri primele. */
export function sortMemorials(memorials: PetMemorial[]): PetMemorial[] {
  return [...memorials].sort(
    (a, b) => new Date(b.passed_at).getTime() - new Date(a.passed_at).getTime()
  );
}

/** Sortare planuri: cele mai incomplete primele (de completat urgent). */
export function sortPlansByCompleteness(plans: LegacyPlan[]): LegacyPlan[] {
  return [...plans].sort(
    (a, b) => planCompleteness(a) - planCompleteness(b)
  );
}
