/**
 * Modul Adopții — anunțuri de adoptare & aplicații.
 * Aliniat cu schema DB upstream: adoption_listings + adoption_applications
 * (0001_init.sql; extensia mobilă 0023 adaugă doar indexuri + realtime).
 */
import type { Species } from './pet';

/** Status anunț adoptare */
export type AdoptionStatus = 'available' | 'pending' | 'adopted';

/** Sexul animalului din anunț (identic cu PetSex) */
export type AdoptionSex = 'male' | 'female' | 'unknown';

/** Mărimea animalului (check constraint în DB) */
export type AdoptionSize = 'small' | 'medium' | 'large';

/** Status aplicație (check constraint în DB) */
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/** Anunț de adoptare */
export interface AdoptionListing {
  id: string;
  posted_by: string;
  name: string;
  species: Species;
  breed: string | null;
  age_years: number | null;
  sex: AdoptionSex;
  size: AdoptionSize;
  description: string | null;
  city: string | null;
  photo_url: string | null;
  status: AdoptionStatus;
  created_at: string;
  updated_at: string;
  /** denormalizat pentru UI (join în query) */
  poster?: { full_name: string | null; avatar_url: string | null } | null;
}

/** Input creare anunț (validat de AdoptionListingSchema) */
export interface AdoptionListingInput {
  name: string;
  species: Species;
  breed?: string | null;
  age_years?: number | null;
  sex: AdoptionSex;
  size: AdoptionSize;
  description?: string | null;
  city?: string | null;
  photo_url?: string | null;
}

/** Aplicație la un anunț (candidat vrea să adopte) */
export interface AdoptionApplication {
  id: string;
  listing_id: string;
  applicant_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  /** denormalizat pentru UI (join în query) */
  listing_name?: string;
  applicant_name?: string;
  applicant_avatar?: string | null;
}

/** Filtre listă anunțuri */
export interface AdoptionFilters {
  species?: Species;
  city?: string;
  /** default 'available' din UI */
  status?: AdoptionStatus;
}

/** Meta-ui sex (emoji pentru card) */
export const ADOPTION_SEX_EMOJI: Record<AdoptionSex, string> = {
  male: '♂',
  female: '♀',
  unknown: '?',
};

/** Meta-ui mărime (cheie i18n) */
export const ADOPTION_SIZES: AdoptionSize[] = ['small', 'medium', 'large'];

/** Ordine picker status anunțuri proprii */
export const ADOPTION_STATUSES: AdoptionStatus[] = ['available', 'pending', 'adopted'];
