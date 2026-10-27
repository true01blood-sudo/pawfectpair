/**
 * Validare Zod pentru modulul PetLegacy (plan îngrijire + memorial).
 */

import { z } from 'zod';
import { TRAINER_PHONE_REGEX } from './edu';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dată invalidă (AAAA-LL-ZZ)')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !isNaN(d.getTime()) && d.getFullYear() >= 1980 && d.getFullYear() <= 2100;
  }, 'Data trebuie să fie între 1980 și 2100');

/** Sumă maximă buget (100.000 RON) */
export const LEGACY_MAX_AMOUNT_CENTS = 10_000_000;

/** Plan de îngrijire */
export const LegacyPlanSchema = z.object({
  pet_id: z
    .string()
    .uuid('ID animal invalid')
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  guardian_name: z
    .string()
    .trim()
    .min(2, 'Numele îngrijitorului trebuie să aibă minim 2 caractere')
    .max(80, 'Numele îngrijitorului poate avea maxim 80 de caractere'),
  guardian_phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || TRAINER_PHONE_REGEX.test(v), 'Număr de telefon invalid'),
  guardian_email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || z.string().email().safeParse(v).success, 'Adresă de email invalidă'),
  instructions: z
    .string()
    .trim()
    .max(1000, 'Instrucțiunile pot avea maxim 1000 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  care_budget_cents: z
    .number()
    .int('Bugetul trebuie să fie un număr întreg (bani)')
    .min(0, 'Bugetul nu poate fi negativ')
    .max(LEGACY_MAX_AMOUNT_CENTS, 'Bugetul maxim este 100.000 RON')
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  wishes: z
    .string()
    .trim()
    .max(1000, 'Dorințele pot avea maxim 1000 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
});

export type LegacyPlanForm = z.infer<typeof LegacyPlanSchema>;

/** Memorial digital */
export const PetMemorialSchema = z.object({
  pet_id: z
    .string()
    .uuid('ID animal invalid')
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  pet_name: z
    .string()
    .trim()
    .min(1, 'Numele animalului este obligatoriu')
    .max(60, 'Numele animalului poate avea maxim 60 de caractere'),
  species: z
    .string()
    .trim()
    .max(30, 'Specia poate avea maxim 30 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  photo_url: z
    .string()
    .url('URL poză invalid')
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
  tribute: z
    .string()
    .trim()
    .max(1500, 'Tributul poate avea maxim 1500 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  favorite_memory: z
    .string()
    .trim()
    .max(500, 'Amintirea preferată poate avea maxim 500 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  passed_at: isoDate,
  resting_place: z
    .string()
    .trim()
    .max(120, 'Locul de odihnă poate avea maxim 120 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  is_public: z.boolean().default(false),
});

export type PetMemorialForm = z.infer<typeof PetMemorialSchema>;
