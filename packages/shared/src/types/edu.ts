/**
 * Modul PetEdu — educație (articole curatoriate) + Traineri (instructori de animale).
 *
 * - EduArticle: aliniat cu schema DB upstream (0011/0012/0017) — vizibil de toți,
 *   administrat de admini. Content static RO/EN în i18n + seed DB.
 * - Trainer: NOU (migrația 0026) — instructori/dresori care își publică profilul,
 *   cu specialități, oraș, experiență, telefon; „verified" e setat doar de admini.
 */

// ============================================================
// ARTICOLE EDUCAȚIONALE
// ============================================================

/** Specie țintă a articolului (check constraint în DB) */
export type EduSpecies = 'general' | 'caine' | 'pisica' | 'altele';

/** Articol educațional curatoriat */
export interface EduArticle {
  id: string;
  title: string;
  body: string;
  species: EduSpecies;
  category: string | null;
  created_by: string | null;
  created_at: string;
}

export const EDU_SPECIES: EduSpecies[] = ['general', 'caine', 'pisica', 'altele'];

export const EDU_SPECIES_EMOJI: Record<EduSpecies, string> = {
  general: '🐾',
  caine: '🐕',
  pisica: '🐈',
  altele: '🐰',
};

/** Filtre listare articole */
export interface EduFilters {
  species?: EduSpecies | null;
  category?: string | null;
  search?: string | null;
}

// ============================================================
// TRAINERI (INSTRUCTORI) DE ANIMALE
// ============================================================

/** Specializare trainer (membrată ca text[] în DB) */
export type TrainerSpecialty =
  | 'obedience'
  | 'behavior'
  | 'agility'
  | 'puppy'
  | 'protection'
  | 'therapy';

export const TRAINER_SPECIALTIES: TrainerSpecialty[] = [
  'obedience',
  'behavior',
  'agility',
  'puppy',
  'protection',
  'therapy',
];

export const TRAINER_SPECIALTY_EMOJI: Record<TrainerSpecialty, string> = {
  obedience: '🎯',
  behavior: '🧠',
  agility: '🏃',
  puppy: '🐶',
  protection: '🛡️',
  therapy: '💚',
};

/** Profil trainer/instructor publicat în director */
export interface Trainer {
  id: string;
  user_id: string;
  display_name: string;
  specialties: TrainerSpecialty[];
  city: string | null;
  bio: string | null;
  experience_years: number;
  phone: string | null;
  price_range: string | null;
  photo_url: string | null;
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input salvare profil trainer (Zod: TrainerProfileSchema) */
export interface TrainerInput {
  display_name: string;
  specialties: TrainerSpecialty[];
  city?: string | null;
  bio?: string | null;
  experience_years: number;
  phone?: string | null;
  price_range?: string | null;
}

/** Filtre listare traineri */
export interface TrainerFilters {
  specialty?: TrainerSpecialty | null;
  city?: string | null;
  search?: string | null;
}
