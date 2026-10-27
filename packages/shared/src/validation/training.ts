/**
 * Validare Zod pentru modulul PetTraining (abilități + sesiuni).
 */

import { z } from 'zod';
import {
  TRAINING_CATEGORIES,
  TRAINING_SKILL_STATUSES,
} from '../types/training';

const CATEGORY_TUPLE = TRAINING_CATEGORIES as unknown as [string, ...string[]];
const STATUS_TUPLE = TRAINING_SKILL_STATUSES as unknown as [string, ...string[]];

const isoDatetime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, 'Dată/oră invalidă (ISO)')
  .refine((v) => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  }, 'Data trebuie să fie între anii 2000 și 2100');

/** Abilitate nouă/editată */
export const TrainingSkillSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  name: z
    .string()
    .trim()
    .min(2, 'Numele abilității trebuie să aibă minim 2 caractere')
    .max(60, 'Numele abilității poate avea maxim 60 de caractere'),
  category: z.enum(CATEGORY_TUPLE, {
    errorMap: () => ({ message: 'Categorie de antrenament invalidă' }),
  }),
  difficulty: z
    .number()
    .int('Dificultatea trebuie să fie un număr întreg')
    .min(1, 'Dificultatea minimă este 1')
    .max(5, 'Dificultatea maximă este 5'),
  target_sessions: z
    .number()
    .int('Ținta trebuie să fie un număr întreg de sesiuni')
    .min(1, 'Minim 1 sesiune')
    .max(200, 'Maxim 200 de sesiuni'),
});

export type TrainingSkillForm = z.infer<typeof TrainingSkillSchema>;

/** Sesiune de antrenament nouă */
export const TrainingSessionSchema = z.object({
  skill_id: z.string().uuid('ID abilitate invalid'),
  duration_minutes: z
    .number()
    .int('Durata trebuie să fie un număr întreg de minute')
    .min(1, 'Minim 1 minut')
    .max(180, 'Maxim 180 de minute per sesiune'),
  rating: z
    .number()
    .int('Rating-ul trebuie să fie un număr întreg')
    .min(1, 'Rating-ul minim este 1')
    .max(5, 'Rating-ul maxim este 5'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notele pot avea maxim 500 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  practiced_at: isoDatetime.optional(),
});

export type TrainingSessionForm = z.infer<typeof TrainingSessionSchema>;

/** Schimbare status abilitate */
export const TrainingSkillStatusSchema = z.enum(STATUS_TUPLE, {
  errorMap: () => ({ message: 'Status abilitate invalid' }),
});
