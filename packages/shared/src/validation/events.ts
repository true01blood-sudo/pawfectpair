/**
 * Validare Zod pentru modulul PetEvents (evenimente + RSVP).
 */

import { z } from 'zod';
import {
  EVENT_TYPES,
  EVENT_AUDIENCES,
  EVENT_RSVP_STATUSES,
} from '../types/events';
import { TRAINER_PHONE_REGEX } from './edu';

const TYPE_TUPLE = EVENT_TYPES as unknown as [string, ...string[]];
const AUDIENCE_TUPLE = EVENT_AUDIENCES as unknown as [string, ...string[]];
const RSVP_TUPLE = EVENT_RSVP_STATUSES as unknown as [string, ...string[]];

/** Durata maximă a unui eveniment: 14 zile */
export const EVENTS_MAX_DURATION_DAYS = 14;

const isoDatetime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, 'Dată/oră invalidă (ISO)')
  .refine((v) => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  }, 'Data trebuie să fie între anii 2000 și 2100');

export const PetEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Titlul trebuie să aibă minim 3 caractere')
      .max(80, 'Titlul poate avea maxim 80 de caractere'),
    event_type: z.enum(TYPE_TUPLE, {
      errorMap: () => ({ message: 'Tip de eveniment invalid' }),
    }),
    audience: z.enum(AUDIENCE_TUPLE).optional().default('all'),
    city: z
      .string()
      .trim()
      .min(2, 'Orașul trebuie să aibă minim 2 caractere')
      .max(60, 'Orașul poate avea maxim 60 de caractere'),
    description: z
      .string()
      .trim()
      .max(1000, 'Descrierea poate avea maxim 1000 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    location: z
      .string()
      .trim()
      .max(120, 'Locația poate avea maxim 120 de caractere')
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v)),
    starts_at: isoDatetime,
    ends_at: isoDatetime,
    max_participants: z
      .number()
      .int('Numărul de participanți trebuie să fie întreg')
      .min(2, 'Minim 2 participanți')
      .max(5000, 'Maxim 5000 de participanți')
      .optional()
      .nullable()
      .transform((v) => (v === undefined ? null : v)),
    photo_url: z
      .string()
      .url('URL poză invalid')
      .optional()
      .nullable()
      .transform((v) => (v === undefined ? null : v)),
    contact_phone: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === '' || v === undefined ? null : v))
      .refine((v) => v === null || TRAINER_PHONE_REGEX.test(v), 'Număr de telefon invalid'),
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
    if (days > EVENTS_MAX_DURATION_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Evenimentul poate dura maxim ${EVENTS_MAX_DURATION_DAYS} de zile`,
        path: ['ends_at'],
      });
    }
  });

export type PetEventForm = z.infer<typeof PetEventSchema>;

/** RSVP la un eveniment */
export const EventRsvpSchema = z.object({
  event_id: z.string().uuid('ID eveniment invalid'),
  status: z.enum(RSVP_TUPLE, {
    errorMap: () => ({ message: 'Status RSVP invalid' }),
  }),
});

export type EventRsvpForm = z.infer<typeof EventRsvpSchema>;

/** Schimbare status eveniment (organizator) */
export const EventStatusSchema = z.enum(['published', 'cancelled'] as unknown as [string, ...string[]], {
  errorMap: () => ({ message: 'Status eveniment invalid' }),
});
