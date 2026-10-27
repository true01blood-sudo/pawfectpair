/**
 * Validare Zod pentru modulul PetDay (oferte pet-sitting / pet-hotel + rezervări).
 */

import { z } from 'zod';
import {
  PETDAY_SERVICES,
  PETDAY_PROVIDER_TYPES,
  PETDAY_PRICE_UNITS,
} from '../types/petday';
import { TRAINER_PHONE_REGEX } from './edu';

/** Set de servicii pentru Zod enum (tuple non-readonly) */
const SERVICE_TUPLE = PETDAY_SERVICES as unknown as [string, ...string[]];
const PROVIDER_TUPLE = PETDAY_PROVIDER_TYPES as unknown as [string, ...string[]];
const PRICE_UNIT_TUPLE = PETDAY_PRICE_UNITS as unknown as [string, ...string[]];

export const PetDayListingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Titlul trebuie să aibă minim 3 caractere')
      .max(80, 'Titlul poate avea maxim 80 de caractere'),
    provider_type: z.enum(PROVIDER_TUPLE, {
      errorMap: () => ({ message: 'Tip ofertant invalid' })
    }),
    services: z
      .array(z.enum(SERVICE_TUPLE))
      .min(1, 'Alege cel puțin un serviciu')
      .max(PETDAY_SERVICES.length, 'Servicii invalide')
      .refine((arr) => new Set(arr).size === arr.length, 'Serviciile nu se pot repeta'),
    city: z
      .string()
      .trim()
      .min(2, 'Orașul trebuie să aibă minim 2 caractere')
      .max(60, 'Orașul poate avea maxim 60 de caractere'),
    description: z
      .string()
      .trim()
      .max(800, 'Descrierea poate avea maxim 800 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    address: z
      .string()
      .trim()
      .max(120, 'Adresa poate avea maxim 120 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    price_from: z
      .number()
      .min(0, 'Prețul nu poate fi negativ')
      .max(100000, 'Prețul este prea mare')
      .optional()
      .nullable()
      .transform((v) => (v === undefined ? null : v)),
    price_unit: z.enum(PRICE_UNIT_TUPLE).optional().default('day'),
    max_pets: z
      .number()
      .int('Numărul de animale trebuie să fie întreg')
      .min(1, 'Minim 1 animal')
      .max(50, 'Maxim 50 de animale')
      .optional()
      .nullable()
      .transform((v) => (v === undefined ? null : v)),
    accepts_dogs: z.boolean().optional().default(true),
    accepts_cats: z.boolean().optional().default(true),
    accepts_other: z.boolean().optional().default(false),
    photo_url: z
      .string()
      .url('URL poză invalid')
      .optional()
      .nullable()
      .transform((v) => (v === undefined ? null : v)),
    phone: z
      .string()
      .trim()
      .regex(TRAINER_PHONE_REGEX, 'Număr de telefon invalid')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
  })
  .refine((d) => d.accepts_dogs || d.accepts_cats || d.accepts_other, {
    message: 'Selectează cel puțin o specie acceptată',
    path: ['accepts_dogs'],
  });

export type PetDayListingForm = z.infer<typeof PetDayListingSchema>;

/** Durata maximă a unei rezervări: 90 de zile */
export const PETDAY_MAX_BOOKING_DAYS = 90;
/** Rezervările se fac cel puțin cu 1 oră înainte */
export const PETDAY_MIN_LEAD_HOURS = 1;

const isoDatetime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, 'Dată/oră invalidă (ISO)')
  .refine((v) => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  }, 'Data trebuie să fie între anii 2000 și 2100');

export const PetDayBookingSchema = z
  .object({
    listing_id: z.string().uuid('ID ofertă invalid'),
    pet_id: z
      .string()
      .uuid('ID animal invalid')
      .optional()
      .nullable()
      .transform((v) => (v === undefined ? null : v)),
    starts_at: isoDatetime,
    ends_at: isoDatetime,
    note: z
      .string()
      .trim()
      .max(400, 'Nota poate avea maxim 400 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
  })
  .superRefine((d, ctx) => {
    const start = new Date(d.starts_at).getTime();
    const end = new Date(d.ends_at).getTime();
    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de final trebuie să fie după data de început',
        path: ['ends_at'],
      });
      return;
    }
    const days = (end - start) / (24 * 60 * 60 * 1000);
    if (days > PETDAY_MAX_BOOKING_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Rezervarea poate acoperi maxim ${PETDAY_MAX_BOOKING_DAYS} de zile`,
        path: ['ends_at'],
      });
    }
  });

export type PetDayBookingForm = z.infer<typeof PetDayBookingSchema>;

/** Schema pentru schimbarea statusului unei rezervări */
export const PetDayBookingStatusSchema = z.enum(
  ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] as unknown as [string, ...string[]],
  {
    errorMap: () => ({ message: 'Status invalid' })
  }
);
