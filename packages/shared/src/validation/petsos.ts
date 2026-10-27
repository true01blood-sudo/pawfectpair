/**
 * Validare Zod pentru modulul PetSOS (evenimente urgență + contact urgență).
 * VALIDARE DUBLĂ: client-side aici + check constraints în DB (0013/0025).
 */
import { z } from 'zod';

export const SOS_NOTES_MAX = 500;
export const EMERGENCY_NAME_MAX = 60;
export const EMERGENCY_PHONE_MAX = 20;

export const SosEventTypeSchema = z.enum(['medical', 'lost', 'danger'], {
  errorMap: () => ({ message: 'Tip urgență invalid' }),
});

export const SosEventSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  type: SosEventTypeSchema,
  notes: z
    .string()
    .trim()
    .max(SOS_NOTES_MAX, `Notele pot avea maxim ${SOS_NOTES_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type SosEventParsed = z.infer<typeof SosEventSchema>;

/**
 * Contact de urgență pe animal. Reguli:
 *  - ambele câmpuri pot fi null (ștergere contact);
 *  - dacă e prezent numele, e obligatoriu și telefonul valid (RO/intl);
 *  - telefonul acceptă cifre, spații, +, -, (), max 20 caractere.
 */
export const EmergencyContactSchema = z
  .object({
    emergency_contact_name: z
      .string()
      .trim()
      .max(EMERGENCY_NAME_MAX, `Numele poate avea maxim ${EMERGENCY_NAME_MAX} caractere`)
      .optional()
      .transform((v) => (v ? v : null)),
    emergency_contact_phone: z
      .string()
      .trim()
      .max(EMERGENCY_PHONE_MAX, 'Telefonul poate avea maxim 20 caractere')
      .refine(
        (v) => v === '' || /^[+()0-9\s-]{6,20}$/.test(v),
        'Număr de telefon invalid'
      )
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .superRefine((val, ctx) => {
    if (val.emergency_contact_name && !val.emergency_contact_phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Introdu și numărul de telefon',
        path: ['emergency_contact_phone'],
      });
    }
  });

export type EmergencyContactParsed = z.infer<typeof EmergencyContactSchema>;
