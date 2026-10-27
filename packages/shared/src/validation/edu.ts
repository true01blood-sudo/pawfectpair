/**
 * Validare Zod pentru modulul PetEdu (profil trainer).
 * VALIDARE DUBLĂ: client-side aici + check constraints în DB (0026).
 * Articolele edu sunt admin-managed — nu se validează aici (read-only în app).
 */
import { z } from 'zod';
import { TRAINER_SPECIALTIES } from '../types/edu';

export const TRAINER_NAME_MIN = 2;
export const TRAINER_NAME_MAX = 60;
export const TRAINER_BIO_MAX = 600;
export const TRAINER_CITY_MAX = 60;
export const TRAINER_PRICE_MAX = 30;
export const TRAINER_PHONE_MAX = 20;
export const TRAINER_EXPERIENCE_MAX = 60;
export const TRAINER_SPECIALTIES_MAX = 6;

/** Telefon trainer — aceleași reguli ca la contactul de urgență (PetSOS) */
export const TRAINER_PHONE_REGEX = /^[+()0-9\s-]{6,20}$/;

const specialtiesEnum = TRAINER_SPECIALTIES as unknown as [string, ...string[]];

export const TrainerSpecialtySchema = z.enum(
  specialtiesEnum as [string, ...string[]],
  { errorMap: () => ({ message: 'Specializare invalidă' }) }
);

/**
 * Profil trainer public. Reguli:
 *  - nume 2-60 caractere;
 *  - minim 1 specializare, maxim 6, fără duplicate;
 *  - experiență 0-60 ani (integer);
 *  - dacă e prezent telefonul, trebuie să treacă regex-ul;
 *  - bio/oraș/pricing opționale, sanitizate apoi în queries.
 */
export const TrainerProfileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(TRAINER_NAME_MIN, `Numele trebuie să aibă cel puțin ${TRAINER_NAME_MIN} caractere`)
    .max(TRAINER_NAME_MAX, `Numele poate avea maxim ${TRAINER_NAME_MAX} caractere`),
  specialties: z
    .array(z.string().trim().nonempty())
    .min(1, 'Alege cel puțin o specializare')
    .max(TRAINER_SPECIALTIES_MAX, `Maxim ${TRAINER_SPECIALTIES_MAX} specializări`)
    .refine(
      (arr) => arr.every((s) => (TRAINER_SPECIALTIES as string[]).includes(s)),
      { message: 'Specializare necunoscută' }
    )
    .refine((arr) => new Set(arr).size === arr.length, {
      message: 'Specializările trebuie să fie unice',
    }),
  city: z
    .string()
    .trim()
    .max(TRAINER_CITY_MAX, `Orașul poate avea maxim ${TRAINER_CITY_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
  bio: z
    .string()
    .trim()
    .max(TRAINER_BIO_MAX, `Descrierea poate avea maxim ${TRAINER_BIO_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
  experience_years: z
    .number({ invalid_type_error: 'Experiența trebuie să fie un număr' })
    .int('Experiența trebuie să fie un număr întreg')
    .min(0, 'Experiența nu poate fi negativă')
    .max(TRAINER_EXPERIENCE_MAX, `Experiența poate fi maxim ${TRAINER_EXPERIENCE_MAX} ani`),
  phone: z
    .string()
    .trim()
    .max(TRAINER_PHONE_MAX, 'Telefonul poate avea maxim 20 caractere')
    .refine((v) => v === '' || TRAINER_PHONE_REGEX.test(v), 'Număr de telefon invalid')
    .optional()
    .transform((v) => (v ? v : null)),
  price_range: z
    .string()
    .trim()
    .max(TRAINER_PRICE_MAX, `Prețul poate avea maxim ${TRAINER_PRICE_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type TrainerProfileParsed = z.infer<typeof TrainerProfileSchema>;
