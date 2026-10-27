import { z } from 'zod';
import { SPECIES_OPTIONS, PET_SEX_OPTIONS } from '../constants/pet';

export const PetSchema = z.object({
  name: z
    .string()
    .min(1, 'Numele este obligatoriu')
    .max(50, 'Numele poate avea maxim 50 de caractere'),
  species: z.enum(SPECIES_OPTIONS, {
    errorMap: () => ({ message: 'Specie invalidă' })
  }),
  sex: z.enum(PET_SEX_OPTIONS, {
    errorMap: () => ({ message: 'Sex invalid' })
  }),
  breed: z.string().max(50, 'Rasa poate avea maxim 50 de caractere').optional().nullable(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data trebuie să fie în format YYYY-MM-DD')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d <= new Date();
    }, 'Data nașterii nu poate fi în viitor')
    .optional()
    .nullable(),
  photo_url: z.string().url('URL poză invalid').optional().nullable(),
  notes: z.string().max(2000, 'Notele pot avea maxim 2000 de caractere').optional().nullable(),
  // ——— Pedigree (câini & pisici) ———
  pedigree_registered: z.boolean().optional().nullable(),
  pedigree_registry: z
    .string()
    .trim()
    .max(60, 'Registrul poate avea maxim 60 de caractere')
    .optional()
    .nullable(),
  pedigree_number: z
    .string()
    .trim()
    .max(60, 'Numărul pedigree poate avea maxim 60 de caractere')
    .optional()
    .nullable(),
  // ——— Cadrul legal OUG 55/2002 (câini) ———
  dangerous_breed: z.boolean().optional().nullable(),
  oug50_category: z
    .number()
    .int()
    .refine((v) => v === 0 || v === 1 || v === 2, 'Categorie OUG invalidă')
    .optional()
    .nullable(),
  oug50_owner_18: z.boolean().optional().nullable(),
  oug50_registration: z.boolean().optional().nullable(),
  oug50_microchip: z.boolean().optional().nullable(),
  oug50_insurance: z.boolean().optional().nullable(),
  oug50_sign: z.boolean().optional().nullable(),
  oug50_sterilized: z.boolean().optional().nullable(),
});

/**
 * Schema pentru formularul complet al animalului — include pedigree + OUG,
 * dar și câmpurile de bază. Folosită de PetForm.
 */
export const PetSchemaFull = PetSchema;

export type PetForm = z.infer<typeof PetSchema>;
