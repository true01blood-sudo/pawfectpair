/**
 * Module PetPlanner — program de activități & reminder-uri pentru animale.
 * Aliniat cu schema DB: supabase/migrations/0022_petplanner.sql
 * (identică cu tabela `planner_tasks` din 0011_petplanner_petedu.sql —
 * extensia 0022 adaugă indexuri + realtime, fără a schimba structura).
 */

/** Categorii de activități (check constraint în DB) */
export type PlannerCategory = 'feeding' | 'walk' | 'grooming' | 'medication' | 'other';

/** Recurență activitate (check constraint în DB) */
export type PlannerRecurrence = 'none' | 'daily' | 'weekly';

/** Activitate planificată pentru un animal */
export interface PlannerTask {
  id: string;
  pet_id: string;
  owner_id: string;
  title: string;
  category: PlannerCategory;
  /** ISO 8601 — termenul până la care trebuie făcută activitatea */
  due_at: string;
  recurrence: PlannerRecurrence;
  done: boolean;
  created_at: string;
}

/** Input pentru creare activitate (validat de PlannerTaskSchema) */
export interface PlannerTaskInput {
  pet_id: string;
  title: string;
  category: PlannerCategory;
  due_at: string;
  recurrence: PlannerRecurrence;
}

/** Grupare derivată pentru UI (Astăzi / Întârziate / Viitoare / Finalizate) */
export type PlannerBucket = 'overdue' | 'today' | 'upcoming' | 'done';

/** Meta-ui pentru categorii: emoji asociat (label-ul vine din i18n) */
export const PLANNER_CATEGORY_EMOJI: Record<PlannerCategory, string> = {
  feeding: '🍽️',
  walk: '🚶',
  grooming: '✂️',
  medication: '💊',
  other: '📌',
};

/** Ordinea de afișare a categoriilor în picker */
export const PLANNER_CATEGORIES: PlannerCategory[] = [
  'feeding',
  'walk',
  'grooming',
  'medication',
  'other',
];

/** Ordinea de afișare a recurențelor în picker */
export const PLANNER_RECURRENCES: PlannerRecurrence[] = ['none', 'daily', 'weekly'];
