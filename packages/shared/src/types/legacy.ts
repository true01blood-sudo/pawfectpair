/**
 * Tipuri pentru modulul PetLegacy — plan de îngrijire pentru Situații de
 * Urgență + memorial digital pentru animalele plecate.
 */

import type { Pet } from './pet';

/** Plan de îngrijire („dacă nu mai pot avea grijă de el") per animal */
export interface LegacyPlan {
  id: string;
  user_id: string;
  pet_id: string | null;
  guardian_name: string;
  guardian_phone: string | null;
  guardian_email: string | null;
  instructions: string | null;
  /** buget lunar estimat pentru îngrijitor (bani) */
  care_budget_cents: number | null;
  wishes: string | null;
  created_at: string;
  updated_at: string;
}

/** Plan cu numele animalului */
export interface LegacyPlanWithPet extends LegacyPlan {
  pet?: Pick<Pet, 'id' | 'name' | 'photo_url'> | null;
}

/** Memorial digital pentru un animal plecat */
export interface PetMemorial {
  id: string;
  user_id: string;
  pet_id: string | null;
  pet_name: string;
  species: string | null;
  photo_url: string | null;
  tribute: string | null;
  favorite_memory: string | null;
  /** data trecerii în neființă (YYYY-MM-DD) */
  passed_at: string;
  resting_place: string | null;
  /** vizibil public (pagină de omagiu) sau doar pentru tine */
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** Input plan de îngrijire */
export interface LegacyPlanInput {
  pet_id: string | null;
  guardian_name: string;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  instructions?: string | null;
  care_budget_cents?: number | null;
  wishes?: string | null;
}

/** Input memorial */
export interface PetMemorialInput {
  pet_id: string | null;
  pet_name: string;
  species?: string | null;
  photo_url?: string | null;
  tribute?: string | null;
  favorite_memory?: string | null;
  passed_at: string;
  resting_place?: string | null;
  is_public: boolean;
}

/** Element checklist pentru completitudinea planului */
export interface LegacyChecklistItem {
  key: 'guardian' | 'phone' | 'instructions' | 'budget' | 'wishes';
  done: boolean;
}
