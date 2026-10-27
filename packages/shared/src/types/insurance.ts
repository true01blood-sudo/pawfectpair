/**
 * Tipuri pentru modulul PetInsurance — asigurări veterinare:
 * polițe per animal + dosar de despăgubiri (claims) cu tranziții de status.
 */

import type { Pet } from './pet';

/** Tip de poliță */
export type PolicyType =
  | 'accident'       // doar accidente
  | 'illness'        // doar boli
  | 'comprehensive'  // cuprinzătoare (accident + boli + operații)
  | 'liability';     // răspundere civilă („corp tutelar" pentru câini)

export const POLICY_TYPES = ['accident', 'illness', 'comprehensive', 'liability'] as const;

export const POLICY_TYPE_EMOJI: Record<PolicyType, string> = {
  accident: '🩹',
  illness: '🦠',
  comprehensive: '🛡️',
  liability: '⚖️',
};

/** Status poliță */
export type PolicyStatus = 'active' | 'expired' | 'cancelled';

export const POLICY_STATUSES = ['active', 'expired', 'cancelled'] as const;

/** Status despăgubire */
export type ClaimStatus = 'submitted' | 'approved' | 'rejected' | 'paid';

export const CLAIM_STATUSES = ['submitted', 'approved', 'rejected', 'paid'] as const;

/** Poliță de asigurare */
export interface InsurancePolicy {
  id: string;
  user_id: string;
  pet_id: string | null;
  provider: string;
  policy_number: string | null;
  policy_type: PolicyType;
  /** prima lunară în bani (ex: cenți / bani) */
  premium_cents: number;
  /** plafon despăgubire pe an (null = nelimitat) */
  coverage_limit_cents: number | null;
  /** franhiză per eveniment (null = fără) */
  deductible_cents: number | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: PolicyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Poliță cu numele animalului (listare) */
export interface InsurancePolicyWithPet extends InsurancePolicy {
  pet?: Pick<Pet, 'id' | 'name' | 'photo_url'> | null;
}

/** Cerere de despăgubire */
export interface InsuranceClaim {
  id: string;
  policy_id: string;
  user_id: string;
  claim_date: string; // YYYY-MM-DD
  description: string;
  amount_cents: number;
  status: ClaimStatus;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

/** Cerere cu referință poliță */
export interface InsuranceClaimWithPolicy extends InsuranceClaim {
  policy?: Pick<InsurancePolicy, 'id' | 'provider' | 'policy_type'> | null;
}

/** Filtre polițe */
export interface InsuranceFilters {
  petId?: string | null;
  status?: PolicyStatus | null;
  policyType?: PolicyType | null;
}

/** Input creare/editare poliță */
export interface InsurancePolicyInput {
  pet_id: string | null;
  provider: string;
  policy_number?: string | null;
  policy_type: PolicyType;
  premium_cents: number;
  coverage_limit_cents?: number | null;
  deductible_cents?: number | null;
  start_date: string;
  end_date: string;
  notes?: string | null;
}

/** Input despăgubire nouă */
export interface InsuranceClaimInput {
  policy_id: string;
  claim_date: string;
  description: string;
  amount_cents: number;
}
