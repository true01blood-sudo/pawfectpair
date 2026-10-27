/**
 * Validare Zod pentru modulul PetResQ (cazuri pierdut/găsit + sfaturi).
 */

import { z } from 'zod';
import { RESQ_TYPES, RESQ_STATUSES } from '../types/resq';
import { TRAINER_PHONE_REGEX } from './edu';

const TYPE_TUPLE = RESQ_TYPES as unknown as [string, ...string[]];
const STATUS_TUPLE = RESQ_STATUSES as unknown as [string, ...string[]];

export const RESQ_SPECIES_OPTIONS = ['caine', 'pisica', 'pasare', 'iepure', 'rozatoare', 'reptila', 'alta'] as const;

const SPECIES_TUPLE = RESQ_SPECIES_OPTIONS as unknown as [string, ...string[]];

/** Caz nou/editat (pierdut sau găsit) */
export const ResqCaseSchema = z.object({
  type: z.enum(TYPE_TUPLE, {
    errorMap: () => ({ message: 'Tip de caz invalid' }),
  }),
  name: z
    .string()
    .trim()
    .min(2, 'Numele trebuie să aibă minim 2 caractere')
    .max(60, 'Numele poate avea maxim 60 de caractere'),
  species: z.enum(SPECIES_TUPLE, {
    errorMap: () => ({ message: 'Specie invalidă' }),
  }),
  description: z
    .string()
    .trim()
    .min(10, 'Descrierea trebuie să aibă minim 10 caractere')
    .max(1000, 'Descrierea poate avea maxim 1000 de caractere'),
  city: z
    .string()
    .trim()
    .max(60, 'Orașul poate avea maxim 60 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine(
      (v) => v === null || v.length >= 2,
      'Orașul trebuie să aibă minim 2 caractere'
    ),
  last_seen_location: z
    .string()
    .trim()
    .max(120, 'Locația poate avea maxim 120 de caractere')
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  contact_phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || TRAINER_PHONE_REGEX.test(v), 'Număr de telefon invalid'),
  photo_url: z
    .string()
    .url('URL poză invalid')
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
  pet_id: z
    .string()
    .uuid('ID animal invalid')
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
});

export type ResqCaseForm = z.infer<typeof ResqCaseSchema>;

/** Schimbare status caz (activ ↔ rezolvat) */
export const ResqStatusSchema = z.enum(STATUS_TUPLE, {
  errorMap: () => ({ message: 'Status caz invalid' }),
});

/** Sfat comunitar pe un caz */
export const ResqTipSchema = z.object({
  case_id: z.string().uuid('ID caz invalid'),
  message: z
    .string()
    .trim()
    .min(2, 'Mesajul trebuie să aibă minim 2 caractere')
    .max(500, 'Mesajul poate avea maxim 500 de caractere'),
});

export type ResqTipForm = z.infer<typeof ResqTipSchema>;
