import type { Species, PetSex } from '../types/pet';

export const SPECIES_OPTIONS = [
  'Câine',
  'Pisică',
  'Iepure',
  'Hamster',
  'Pasăre',
  'Alt animal',
] as const;

export const PET_SEX_OPTIONS = ['male', 'female', 'unknown'] as const;

export const SPECIES_LABELS: Record<PetSex, string> = {
  male: 'Mascul',
  female: 'Femelă',
  unknown: 'Necunoscut',
};

export const SPECIES_EMOJI: Record<Species, string> = {
  'Câine': '🐕',
  'Pisică': '🐈',
  'Iepure': '🐰',
  'Hamster': '🐹',
  'Pasăre': '🐦',
  'Alt animal': '🐾',
};

/** Limită upload imagini (MB) */
export const MAX_PHOTO_SIZE_MB = 5;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Cadrul legal pentru câini periculoși / agresivi — România.
 * Referințe: OUG 55/2002 privind regimul de deținere al câinilor periculoși
 * sau agresivi + Legea 258/2013 privind regimul juridic al câinilor (microchip).
 *
 * CATEGORIA I — câini de luptă și de atac (tip morfologic):
 *   Pit Bull, Boerbull, Bandog + metișii lor.
 * CATEGORIA II — câini agresivi (rase):
 *   American Staffordshire Terrier, Tosa, Rottweiler, Dog Argentinian,
 *   Mastino Napolitano, Fila Brasileiro, Mastiff, Ciobănesc Caucazian,
 *   Cane Corso + metișii lor.
 */
export const OUG50_CAT1_BREEDS = ['Pit Bull', 'Boerbull', 'Bandog'] as const;

export const OUG50_CAT2_BREEDS = [
  'American Staffordshire Terrier',
  'Tosa',
  'Rottweiler',
  'Dog Argentinian',
  'Mastino Napolitano',
  'Fila Brasileiro',
  'Mastiff',
  'Ciobănesc Caucazian',
  'Cane Corso',
] as const;

/** Aliasuri comune folosite în RO (normalizate diacritice-insensibil la cheie). */
export const OUG50_BREED_ALIASES: Record<string, string> = {
  pitbull: 'Pit Bull',
  'pit bull terrier': 'Pit Bull',
  'american pit bull terrier': 'Pit Bull',
  amstaff: 'American Staffordshire Terrier',
  'american staffordshire': 'American Staffordshire Terrier',
  'staffordshire terrier': 'American Staffordshire Terrier',
  rottweiller: 'Rottweiler',
  'dogo argentino': 'Dog Argentinian',
  'dog argentinien': 'Dog Argentinian',
  'fila brasileiro': 'Fila Brasileiro',
  'fila braziliero': 'Fila Brasileiro',
  'tosa inu': 'Tosa',
  tosainu: 'Tosa',
  'mastino napoletano': 'Mastino Napolitano',
  'neapolitan mastiff': 'Mastino Napolitano',
  'caucasian shepherd': 'Ciobănesc Caucazian',
  'ciobanesc caucasian': 'Ciobănesc Caucazian',
  'ovarzka caucaziana': 'Ciobănesc Caucazian',
  'cane corsso': 'Cane Corso',
  canecorso: 'Cane Corso',
};

/** Registre de origine (pedigree) sugerate pentru autocompletare. */
export const PEDIGREE_REGISTRIES = [
  'LRC',
  'FCI',
  'AKC',
  'LO',
  'TICA',
  'CFA',
  'GCCR',
] as const;
