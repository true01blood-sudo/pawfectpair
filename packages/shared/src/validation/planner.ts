/**
 * Validare Zod pentru modulul PetPlanner (activități & reminder-uri).
 * VALIDARE DUBLĂ: client-side aici + check constraints în DB (0022_petplanner.sql).
 */
import { z } from 'zod';

export const TASK_TITLE_MAX = 80;
export const TASK_TITLE_MIN = 2;

/** ISO datetim parseabil, în interval 2000–2100 (anti-garbage, anti-injection) */
export const isoDatetime = z
  .string({ required_error: 'Data este obligatorie' })
  .min(10, 'Data este obligatorie')
  .max(35, 'Data are un format invalid')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Data are un format invalid')
  .refine((v) => {
    const y = new Date(v).getUTCFullYear();
    return y >= 2000 && y <= 2100;
  }, 'Data este în afara intervalului acceptat');

export const PlannerCategorySchema = z.enum(['feeding', 'walk', 'grooming', 'medication', 'other'], {
  errorMap: () => ({ message: 'Categorie invalidă' }),
});

export const PlannerRecurrenceSchema = z.enum(['none', 'daily', 'weekly'], {
  errorMap: () => ({ message: 'Recurență invalidă' }),
});

export const PlannerTaskSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  title: z
    .string({ required_error: 'Titlul este obligatoriu' })
    .trim()
    .min(TASK_TITLE_MIN, `Titlul trebuie să aibă minim ${TASK_TITLE_MIN} caractere`)
    .max(TASK_TITLE_MAX, `Titlul poate avea maxim ${TASK_TITLE_MAX} caractere`),
  category: PlannerCategorySchema,
  due_at: isoDatetime,
  recurrence: PlannerRecurrenceSchema,
});

export type PlannerTaskParsed = z.infer<typeof PlannerTaskSchema>;

/** Update parțial: doar done se poate schimba din UI (restul = șterge + recreează) */
export const PlannerTaskToggleSchema = z.object({
  done: z.boolean({ invalid_type_error: 'Starea done este invalidă' }),
});
