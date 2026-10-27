import { z } from 'zod';
import { MEDICAL_TYPE_OPTIONS } from '../constants/medical';

export const MedicalRecordSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  type: z.enum(MEDICAL_TYPE_OPTIONS, {
    errorMap: () => ({ message: 'Tip medical invalid' })
  }),
  title: z
    .string()
    .min(1, 'Titlul este obligatoriu')
    .max(120, 'Titlul poate avea maxim 120 de caractere'),
  record_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format dată invalid (YYYY-MM-DD)')
    .refine((v) => !isNaN(new Date(v).getTime()), 'Dată invalidă'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format scadență invalid (YYYY-MM-DD)')
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
// validare încrucișată pe câmpuri (zod: superRefine la nivel de obiect —
// refine() pe câmp nu are acces la ctx.parent!)
.superRefine((val, ctx) => {
  if (val.due_date) {
    const due = new Date(val.due_date).getTime();
    const event = new Date(val.record_date).getTime();
    if (Number.isFinite(due) && Number.isFinite(event) && due < event) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Scadența trebuie să fie după data evenimentului',
      });
    }
  }
});

export const WeightLogSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  weight_kg: z
    .number({ invalid_type_error: 'Greutatea trebuie să fie un număr' })
    .positive('Greutatea trebuie să fie pozitivă')
    .max(500, 'Greutatea pare prea mare (max 500 kg)'),
  measured_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format dată invalid (YYYY-MM-DD)')
    .refine((v) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d <= new Date();
    }, 'Data nu poate fi în viitor'),
  notes: z.string().max(500).optional().nullable(),
});

export type MedicalRecordForm = z.infer<typeof MedicalRecordSchema>;
export type WeightLogForm = z.infer<typeof WeightLogSchema>;
