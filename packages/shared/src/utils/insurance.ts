/**
 * Utils PetInsurance — funcții pure pentru expirare, costuri și tranziții.
 * Testate unitar în packages/shared/__tests__/insurance.test.ts.
 */
import type {
  ClaimStatus,
  InsuranceClaim,
  InsuranceClaimWithPolicy,
  InsuranceFilters,
  InsurancePolicy,
  InsurancePolicyWithPet,
  PolicyStatus,
  PolicyType,
} from '../types/insurance';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ziua ISO (YYYY-MM-DD) pentru un Date. */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Zile rămase până la sfârșitul poliței (negativ = expirată de N zile). */
export function policyDaysLeft(
  p: Pick<InsurancePolicy, 'end_date'>,
  now: Date = new Date()
): number {
  const end = new Date(`${p.end_date}T23:59:59Z`).getTime();
  return Math.ceil((end - now.getTime()) / DAY_MS);
}

/** Prag „expiră în curând" (zile) */
export const INSURANCE_EXPIRING_SOON_DAYS = 30;

/** Polița expiră în mai puțin de 30 de zile (și e activă). */
export function isExpiringSoon(
  p: Pick<InsurancePolicy, 'status' | 'end_date'>,
  now: Date = new Date()
): boolean {
  return (
    p.status === 'active' &&
    policyDaysLeft(p, now) <= INSURANCE_EXPIRING_SOON_DAYS
  );
}

/** Statusul calculat din date: polița activă cu end trecut devine „expired". */
export function effectivePolicyStatus(
  p: Pick<InsurancePolicy, 'status' | 'end_date'>,
  now: Date = new Date()
): PolicyStatus {
  if (p.status === 'active' && policyDaysLeft(p, now) < 0) return 'expired';
  return p.status;
}

/** Perechea data-start/end e validă (end strict după start). */
export function isPolicyPeriodValid(p: Pick<InsurancePolicy, 'start_date' | 'end_date'>): boolean {
  return new Date(`${p.end_date}T00:00:00Z`).getTime() >
    new Date(`${p.start_date}T00:00:00Z`).getTime();
}

/** Prima lunară formatată din bani (ex: 149.5 → 149,50 RON). */
export function formatMoneyCents(cents: number): string {
  const ron = cents / 100;
  const hasFraction = Math.abs(ron - Math.trunc(ron)) > 0.001;
  return `${ron.toFixed(hasFraction ? 2 : 0)} RON`;
}

/** Procent din plafonul anual consumat de despăgubiri aprobate/plătite (null fără plafon). */
export function coverageUsedPercent(
  policy: Pick<InsurancePolicy, 'coverage_limit_cents'>,
  claims: InsuranceClaim[]
): number | null {
  if (policy.coverage_limit_cents == null || policy.coverage_limit_cents <= 0) return null;
  const used = claims
    .filter((c) => c.status === 'approved' || c.status === 'paid')
    .reduce((sum, c) => sum + c.amount_cents, 0);
  return Math.min(100, Math.round((used / policy.coverage_limit_cents) * 100));
}

/** Tranziții permise ale unei despăgubiri. */
export function canTransitionClaim(from: ClaimStatus, to: ClaimStatus): boolean {
  const allowed: Record<ClaimStatus, ClaimStatus[]> = {
    submitted: ['approved', 'rejected'],
    approved: ['paid', 'rejected'],
    rejected: [],
    paid: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

/** Etichetele tranzițiilor disponibile pentru UI. */
export function availableClaimTransitions(status: ClaimStatus): ClaimStatus[] {
  const all: ClaimStatus[] = ['approved', 'rejected', 'paid'];
  return all.filter((t) => canTransitionClaim(status, t));
}

/** Total despăgubiri pe status. */
export function claimsTotalByStatus(
  claims: InsuranceClaim[]
): Record<ClaimStatus, number> {
  const out: Record<ClaimStatus, number> = {
    submitted: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
  };
  for (const c of claims) out[c.status] += c.amount_cents;
  return out;
}

/** Filtrare polițe. */
export function filterPolicies(
  policies: InsurancePolicyWithPet[],
  filters: InsuranceFilters,
  now: Date = new Date()
): InsurancePolicyWithPet[] {
  return policies.filter((p) => {
    if (filters.petId && p.pet_id !== filters.petId) return false;
    if (filters.policyType && p.policy_type !== filters.policyType) return false;
    if (filters.status) {
      if (effectivePolicyStatus(p, now) !== filters.status) return false;
    }
    return true;
  });
}

/**
 * Sortare polițe: active primele (cele mai aproape de expirare primele),
 * apoi expirate/anulate (recente primele).
 */
export function sortPolicies(
  policies: InsurancePolicyWithPet[],
  now: Date = new Date()
): InsurancePolicyWithPet[] {
  const eff = (p: InsurancePolicyWithPet) => effectivePolicyStatus(p, now);
  const active = policies
    .filter((p) => eff(p) === 'active')
    .sort((a, b) => policyDaysLeft(a, now) - policyDaysLeft(b, now));
  const rest = policies
    .filter((p) => eff(p) !== 'active')
    .sort((a, b) => (a.end_date < b.end_date ? 1 : -1));
  return [...active, ...rest];
}

/** Sortare despăgubiri: recente primele. */
export function sortClaims<T extends InsuranceClaim | InsuranceClaimWithPolicy>(
  claims: T[]
): T[] {
  return [...claims].sort(
    (a, b) => new Date(b.claim_date).getTime() - new Date(a.claim_date).getTime()
  );
}

/** Cheia sigură pentru tipul poliței (fallback 'comprehensive'). */
export function policyTypeKey(type: string): PolicyType {
  return (POLICY_TYPE_GUARDS as Record<string, PolicyType>)[type] ?? 'comprehensive';
}

const POLICY_TYPE_GUARDS = {
  accident: 'accident',
  illness: 'illness',
  comprehensive: 'comprehensive',
  liability: 'liability',
} as const;
