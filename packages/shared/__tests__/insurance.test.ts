/**
 * Teste PetInsurance — validare Zod + utils polițe/despăgubiri.
 */
import {
  InsurancePolicySchema,
  InsuranceClaimSchema,
  INSURANCE_MAX_AMOUNT_CENTS,
} from '../src/validation/insurance';
import {
  isoDay,
  policyDaysLeft,
  isExpiringSoon,
  effectivePolicyStatus,
  isPolicyPeriodValid,
  formatMoneyCents,
  coverageUsedPercent,
  canTransitionClaim,
  availableClaimTransitions,
  claimsTotalByStatus,
  filterPolicies,
  sortPolicies,
  sortClaims,
  policyTypeKey,
  INSURANCE_EXPIRING_SOON_DAYS,
} from '../src/utils/insurance';
import type {
  InsuranceClaim,
  InsurancePolicyWithPet,
} from '../src/types/insurance';

const NOW = new Date('2026-06-15T10:00:00Z');
const UUID = '11111111-1111-1111-1111-111111111111';

function makePolicy(overrides: Partial<InsurancePolicyWithPet> = {}): InsurancePolicyWithPet {
  return {
    id: 'p1',
    user_id: UUID,
    pet_id: 'pet1',
    provider: 'PetAssure',
    policy_number: 'PA-2026-001',
    policy_type: 'comprehensive',
    premium_cents: 14900,
    coverage_limit_cents: 500000,
    deductible_cents: 15000,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'active',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeClaim(overrides: Partial<InsuranceClaim> = {}): InsuranceClaim {
  return {
    id: 'cl1',
    policy_id: 'p1',
    user_id: UUID,
    claim_date: '2026-06-01',
    description: 'Intervenție chirurgicală după accident',
    amount_cents: 120000,
    status: 'submitted',
    decision_note: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('InsurancePolicySchema', () => {
  const valid = {
    pet_id: '22222222-2222-2222-2222-222222222222',
    provider: 'PetAssure',
    policy_type: 'comprehensive',
    premium_cents: 14900,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
  };

  it('acceptă o poliță validă', () => {
    expect(InsurancePolicySchema.safeParse(valid).success).toBe(true);
  });

  it('acceptă poliță fără animal (familie)', () => {
    const r = InsurancePolicySchema.safeParse({ ...valid, pet_id: null });
    expect(r.success).toBe(true);
  });

  it('respinge provider prea scurt', () => {
    expect(InsurancePolicySchema.safeParse({ ...valid, provider: 'X' }).success).toBe(false);
  });

  it('respinge tip necunoscut', () => {
    expect(
      InsurancePolicySchema.safeParse({ ...valid, policy_type: 'gold' }).success
    ).toBe(false);
  });

  it('respinge end <= start', () => {
    expect(
      InsurancePolicySchema.safeParse({
        ...valid,
        start_date: '2026-06-01',
        end_date: '2026-06-01',
      }).success
    ).toBe(false);
  });

  it('respinge perioadă peste 5 ani', () => {
    expect(
      InsurancePolicySchema.safeParse({
        ...valid,
        start_date: '2026-01-01',
        end_date: '2031-01-02',
      }).success
    ).toBe(false);
    // exact 5 ani calendaristici → OK
    expect(
      InsurancePolicySchema.safeParse({
        ...valid,
        start_date: '2026-01-01',
        end_date: '2031-01-01',
      }).success
    ).toBe(true);
  });

  it('respinge sumă negativă', () => {
    expect(
      InsurancePolicySchema.safeParse({ ...valid, premium_cents: -100 }).success
    ).toBe(false);
  });

  it('respinge sumă peste plafon', () => {
    expect(
      InsurancePolicySchema.safeParse({
        ...valid,
        premium_cents: INSURANCE_MAX_AMOUNT_CENTS + 1,
      }).success
    ).toBe(false);
  });

  it('respinge dată în format greșit', () => {
    expect(
      InsurancePolicySchema.safeParse({ ...valid, start_date: '01.01.2026' }).success
    ).toBe(false);
  });

  it('transformă policy_number gol în null', () => {
    const r = InsurancePolicySchema.safeParse({ ...valid, policy_number: '  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.policy_number).toBeNull();
  });
});

describe('InsuranceClaimSchema', () => {
  const valid = {
    policy_id: UUID,
    claim_date: '2026-06-01',
    description: 'Consult + analize după vomare repetată',
    amount_cents: 45000,
  };

  it('acceptă o despăgubire validă', () => {
    expect(InsuranceClaimSchema.safeParse(valid).success).toBe(true);
  });

  it('respinge descriere sub 10 caractere', () => {
    expect(
      InsuranceClaimSchema.safeParse({ ...valid, description: 'scurt' }).success
    ).toBe(false);
  });

  it('respinge sumă 0 e acceptată dar negativă nu', () => {
    expect(InsuranceClaimSchema.safeParse({ ...valid, amount_cents: 0 }).success).toBe(true);
    expect(InsuranceClaimSchema.safeParse({ ...valid, amount_cents: -1 }).success).toBe(false);
  });

  it('respinge policy_id invalid', () => {
    expect(InsuranceClaimSchema.safeParse({ ...valid, policy_id: 'nope' }).success).toBe(false);
  });
});

describe('policyDaysLeft + expirare', () => {
  it('zile rămase pozitive', () => {
    expect(policyDaysLeft(makePolicy({ end_date: '2026-06-20' }), NOW)).toBe(6);
  });

  it('negativ după expirare', () => {
    expect(policyDaysLeft(makePolicy({ end_date: '2026-06-01' }), NOW)).toBeLessThan(0);
  });

  it('expiră în curând sub 30 zile', () => {
    expect(
      isExpiringSoon(makePolicy({ end_date: '2026-07-10' }), NOW)
    ).toBe(true);
  });

  it('nu e „curând" peste 30 zile', () => {
    expect(
      isExpiringSoon(makePolicy({ end_date: '2026-12-31' }), NOW)
    ).toBe(false);
  });

  it('poliță anulată nu e „expiră în curând"', () => {
    expect(
      isExpiringSoon(makePolicy({ status: 'cancelled', end_date: '2026-06-20' }), NOW)
    ).toBe(false);
  });

  it('status efectiv: activă cu end trecut → expired', () => {
    expect(
      effectivePolicyStatus(makePolicy({ status: 'active', end_date: '2026-06-01' }), NOW)
    ).toBe('expired');
  });

  it('status efectiv păstrează cancelled', () => {
    expect(effectivePolicyStatus(makePolicy({ status: 'cancelled' }), NOW)).toBe('cancelled');
  });

  it('prag constant = 30 zile', () => {
    expect(INSURANCE_EXPIRING_SOON_DAYS).toBe(30);
  });
});

describe('perioadă + bani', () => {
  it('perioadă validă', () => {
    expect(isPolicyPeriodValid(makePolicy())).toBe(true);
    expect(isPolicyPeriodValid(makePolicy({ start_date: '2026-12-31', end_date: '2026-01-01' }))).toBe(false);
  });

  it('formatare bani', () => {
    expect(formatMoneyCents(14900)).toBe('149 RON');
    expect(formatMoneyCents(14950)).toBe('149.50 RON');
    expect(formatMoneyCents(0)).toBe('0 RON');
  });

  it('isoDay scoate partea de dată', () => {
    expect(isoDay(new Date('2026-06-15T13:45:00Z'))).toBe('2026-06-15');
  });
});

describe('coverageUsedPercent', () => {
  it('null fără plafon', () => {
    expect(coverageUsedPercent({ coverage_limit_cents: null }, [makeClaim()])).toBeNull();
  });

  it('procent din plafon consumat de approved+paid', () => {
    const claims = [
      makeClaim({ amount_cents: 100000, status: 'approved' }),
      makeClaim({ amount_cents: 50000, status: 'paid' }),
      makeClaim({ amount_cents: 999999, status: 'rejected' }),
    ];
    expect(coverageUsedPercent({ coverage_limit_cents: 500000 }, claims)).toBe(30);
  });

  it('plafonat la 100', () => {
    const claims = [makeClaim({ amount_cents: 600000, status: 'paid' })];
    expect(coverageUsedPercent({ coverage_limit_cents: 500000 }, claims)).toBe(100);
  });
});

describe('tranziții despăgubiri', () => {
  it('submitted → approved/rejected', () => {
    expect(canTransitionClaim('submitted', 'approved')).toBe(true);
    expect(canTransitionClaim('submitted', 'rejected')).toBe(true);
    expect(canTransitionClaim('submitted', 'paid')).toBe(false);
  });

  it('approved → paid/rejected', () => {
    expect(canTransitionClaim('approved', 'paid')).toBe(true);
    expect(canTransitionClaim('approved', 'rejected')).toBe(true);
  });

  it('rejected și paid sunt finale', () => {
    expect(availableClaimTransitions('rejected')).toEqual([]);
    expect(availableClaimTransitions('paid')).toEqual([]);
  });

  it('etichetele disponibile pentru submitted', () => {
    expect(availableClaimTransitions('submitted').sort()).toEqual(['approved', 'rejected']);
  });
});

describe('claimsTotalByStatus', () => {
  it('totaluri pe status', () => {
    const claims = [
      makeClaim({ amount_cents: 100, status: 'submitted' }),
      makeClaim({ id: 'cl2', amount_cents: 200, status: 'submitted' }),
      makeClaim({ id: 'cl3', amount_cents: 50, status: 'paid' }),
    ];
    const t = claimsTotalByStatus(claims);
    expect(t.submitted).toBe(300);
    expect(t.paid).toBe(50);
    expect(t.approved).toBe(0);
  });
});

describe('filterPolicies + sortPolicies', () => {
  const policies = [
    makePolicy({ id: 'exp', end_date: '2026-06-01' }),
    makePolicy({ id: 'curand', end_date: '2026-06-20' }),
    makePolicy({ id: 'ok', end_date: '2026-12-31', pet_id: 'pet2' }),
    makePolicy({ id: 'canc', status: 'cancelled' }),
  ];

  it('filtează după animal', () => {
    const r = filterPolicies(policies, { petId: 'pet1' }, NOW);
    expect(r.map((p) => p.id).sort()).toEqual(['canc', 'curand', 'exp']);
  });

  it('filtează după status efectiv', () => {
    const r = filterPolicies(policies, { status: 'expired' }, NOW);
    expect(r.map((p) => p.id)).toEqual(['exp']);
  });

  it('filtează după tip', () => {
    const r = filterPolicies(policies, { policyType: 'comprehensive' }, NOW);
    expect(r.length).toBe(4);
  });

  it('active primele: cele mai apropiate de expirare primele', () => {
    const sorted = sortPolicies(policies, NOW);
    expect(sorted[0].id).toBe('curand');
    expect(sorted[sorted.length - 1].id).toBe('exp');
  });
});

describe('sortClaims', () => {
  it('recente primele', () => {
    const claims = [
      makeClaim({ id: 'old', claim_date: '2026-01-10' }),
      makeClaim({ id: 'new', claim_date: '2026-06-10' }),
    ];
    expect(sortClaims(claims).map((c) => c.id)).toEqual(['new', 'old']);
  });
});

describe('policyTypeKey', () => {
  it('chei sigure cu fallback comprehensive', () => {
    expect(policyTypeKey('accident')).toBe('accident');
    expect(policyTypeKey('liability')).toBe('liability');
    expect(policyTypeKey('necunoscut')).toBe('comprehensive');
  });
});
