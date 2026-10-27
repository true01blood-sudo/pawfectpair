/**
 * Validare Zod pentru modulul Adopții (anunțuri + aplicații).
 * VALIDARE DUBLĂ: client-side aici + check constraints în DB (0001/0023).
 */
import { z } from 'zod';
import { SPECIES_OPTIONS } from '../constants/pet';

export const ADOPTION_NAME_MAX = 50;
export const ADOPTION_DESC_MAX = 1000;
export const ADOPTION_CITY_MAX = 60;
export const ADOPTION_MESSAGE_MAX = 500;
export const ADOPTION_AGE_MAX = 50;

export const AdoptionSexSchema = z.enum(['male', 'female', 'unknown'], {
  errorMap: () => ({ message: 'Sex invalid' }),
});

export const AdoptionSizeSchema = z.enum(['small', 'medium', 'large'], {
  errorMap: () => ({ message: 'Mărime invalidă' }),
});

export const AdoptionStatusSchema = z.enum(['available', 'pending', 'adopted'], {
  errorMap: () => ({ message: 'Status anunț invalid' }),
});

export const ApplicationStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'withdrawn'], {
  errorMap: () => ({ message: 'Status aplicație invalid' }),
});

/** URL foto opțional — doar http(s) (sanitizeUrl face validarea finală în queries) */
export const optionalPhotoUrl = z
  .string()
  .trim()
  .max(500, 'URL foto prea lung')
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'URL foto invalid (doar http/https)')
  .optional()
  .transform((v) => (v ? v : null));

export const AdoptionListingSchema = z.object({
  name: z
    .string({ required_error: 'Numele este obligatoriu' })
    .trim()
    .min(2, 'Numele trebuie să aibă minim 2 caractere')
    .max(ADOPTION_NAME_MAX, `Numele poate avea maxim ${ADOPTION_NAME_MAX} caractere`),
  species: z.enum(SPECIES_OPTIONS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Specie invalidă' }),
  }),
  breed: z
    .string()
    .trim()
    .max(ADOPTION_NAME_MAX, 'Rasa poate avea maxim 50 caractere')
    .optional()
    .transform((v) => (v ? v : null)),
  age_years: z
    .number({ invalid_type_error: 'Vârsta trebuie să fie un număr' })
    .min(0, 'Vârsta nu poate fi negativă')
    .max(ADOPTION_AGE_MAX, `Vârsta maximă acceptată este ${ADOPTION_AGE_MAX} ani`)
    .nullable()
    .optional(),
  sex: AdoptionSexSchema,
  size: AdoptionSizeSchema,
  description: z
    .string()
    .trim()
    .max(ADOPTION_DESC_MAX, `Descrierea poate avea maxim ${ADOPTION_DESC_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
  city: z
    .string()
    .trim()
    .max(ADOPTION_CITY_MAX, `Orașul poate avea maxim ${ADOPTION_CITY_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
  photo_url: optionalPhotoUrl,
});

export type AdoptionListingParsed = z.infer<typeof AdoptionListingSchema>;

export const AdoptionApplicationSchema = z.object({
  listing_id: z.string().uuid('ID anunț invalid'),
  message: z
    .string()
    .trim()
    .max(ADOPTION_MESSAGE_MAX, `Mesajul poate avea maxim ${ADOPTION_MESSAGE_MAX} caractere`)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type AdoptionApplicationParsed = z.infer<typeof AdoptionApplicationSchema>;
