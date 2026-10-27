/**
 * Tipuri pentru modulul PetResQ — animale pierdute/găsite:
 * raportări comunitare (lost/found) + sfaturi (tips) de la comunitate.
 * Compatibil cu tabela upstream `resq_cases` (0015).
 */

import type { Profile } from './profile';

/** Tip de caz */
export type ResqType = 'lost' | 'found';

export const RESQ_TYPES = ['lost', 'found'] as const;

export const RESQ_TYPE_EMOJI: Record<ResqType, string> = {
  lost: '📣',
  found: '🎁',
};

/** Status caz */
export type ResqStatus = 'active' | 'resolved';

export const RESQ_STATUSES = ['active', 'resolved'] as const;

/** Caz pierdut/găsit */
export interface ResqCase {
  id: string;
  reporter_id: string;
  pet_id: string | null;
  type: ResqType;
  name: string;
  species: string;
  description: string | null;
  city: string | null;
  last_seen_location: string | null;
  contact_phone: string | null;
  photo_url: string | null;
  status: ResqStatus;
  created_at: string;
  updated_at: string;
}

/** Caz cu reporter (pentru listare) */
export interface ResqCaseWithReporter extends ResqCase {
  reporter?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  /** număr de sfaturi (umplut din embed count) */
  tips_count?: number;
}

/** Sfat comunitar pe un caz */
export interface ResqTip {
  id: string;
  case_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

/** Sfat cu autor */
export interface ResqTipWithAuthor extends ResqTip {
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

/** Filtre listare cazuri */
export interface ResqFilters {
  type?: ResqType | null;
  status?: ResqStatus | null;
  city?: string | null;
  search?: string;
}

/** Input creare/editare caz */
export interface ResqCaseInput {
  type: ResqType;
  name: string;
  species: string;
  description?: string | null;
  city?: string | null;
  last_seen_location?: string | null;
  contact_phone?: string | null;
  photo_url?: string | null;
  pet_id?: string | null;
}
