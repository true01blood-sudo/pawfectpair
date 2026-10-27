/**
 * Teste PetLegacy — validare Zod + utils plan/memorial.
 */
import {
  LegacyPlanSchema,
  PetMemorialSchema,
} from '../src/validation/legacy';
import {
  planChecklist,
  planCompleteness,
  isPlanReady,
  daysSincePassed,
  daysToAnniversary,
  sortMemorials,
  sortPlansByCompleteness,
  LEGACY_READY_THRESHOLD,
} from '../src/utils/legacy';
import type { LegacyPlan, PetMemorial } from '../src/types/legacy';

const NOW = new Date('2026-06-15T10:00:00Z');
const UUID = '11111111-1111-1111-1111-111111111111';

function makePlan(overrides: Partial<LegacyPlan> = {}): LegacyPlan {
  return {
    id: 'pl1',
    user_id: UUID,
    pet_id: 'pet1',
    guardian_name: 'Maria Popescu',
    guardian_phone: '0722111222',
    guardian_email: null,
    instructions: 'Hrană de două ori pe zi, medicament dimineața.',
    care_budget_cents: 50000,
    wishes: 'Să rămână la familie, nu să fie dat în adopție.',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

function makeMemorial(overrides: Partial<PetMemorial> = {}): PetMemorial {
  return {
    id: 'm1',
    user_id: UUID,
    pet_id: null,
    pet_name: 'Rex',
    species: 'caine',
    photo_url: null,
    tribute: 'Cel mai bun prieten al nostru timp de 12 ani.',
    favorite_memory: 'Plimbările de duminică în parc.',
    passed_at: '2025-06-01',
    resting_place: 'Grădina bunicii',
    is_public: false,
    created_at: '2025-06-02T00:00:00Z',
    updated_at: '2025-06-02T00:00:00Z',
    ...overrides,
  };
}

describe('LegacyPlanSchema', () => {
  const valid = {
    pet_id: '22222222-2222-2222-2222-222222222222',
    guardian_name: 'Maria Popescu',
  };

  it('acceptă plan minim valid', () => {
    expect(LegacyPlanSchema.safeParse(valid).success).toBe(true);
  });

  it('respinge guardian prea scurt', () => {
    expect(LegacyPlanSchema.safeParse({ ...valid, guardian_name: 'M' }).success).toBe(false);
  });

  it('respinge telefon invalid', () => {
    expect(
      LegacyPlanSchema.safeParse({ ...valid, guardian_phone: 'nu este telefon' }).success
    ).toBe(false);
  });

  it('acceptă telefon valid', () => {
    expect(
      LegacyPlanSchema.safeParse({ ...valid, guardian_phone: '0722 111 222' }).success
    ).toBe(true);
  });

  it('respinge email invalid', () => {
    expect(
      LegacyPlanSchema.safeParse({ ...valid, guardian_email: 'nu-e-email' }).success
    ).toBe(false);
  });

  it('acceptă email valid', () => {
    expect(
      LegacyPlanSchema.safeParse({ ...valid, guardian_email: 'maria@exemplu.ro' }).success
    ).toBe(true);
  });

  it('respinge buget negativ', () => {
    expect(
      LegacyPlanSchema.safeParse({ ...valid, care_budget_cents: -100 }).success
    ).toBe(false);
  });

  it('transformă câmpuri goale în null', () => {
    const r = LegacyPlanSchema.safeParse({
      ...valid,
      guardian_phone: '',
      instructions: '  ',
      care_budget_cents: undefined,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.guardian_phone).toBeNull();
      expect(r.data.instructions).toBeNull();
      expect(r.data.care_budget_cents).toBeNull();
    }
  });
});

describe('PetMemorialSchema', () => {
  const valid = {
    pet_name: 'Rex',
    passed_at: '2025-06-01',
    is_public: false,
  };

  it('acceptă memorial valid', () => {
    expect(PetMemorialSchema.safeParse(valid).success).toBe(true);
  });

  it('respinge nume gol', () => {
    expect(PetMemorialSchema.safeParse({ ...valid, pet_name: '  ' }).success).toBe(false);
  });

  it('respinge dată invalidă', () => {
    expect(PetMemorialSchema.safeParse({ ...valid, passed_at: '01.06.2025' }).success).toBe(false);
  });

  it('respinge dată înainte de 1980', () => {
    expect(PetMemorialSchema.safeParse({ ...valid, passed_at: '1979-12-31' }).success).toBe(false);
  });

  it('respinge photo_url invalid', () => {
    expect(PetMemorialSchema.safeParse({ ...valid, photo_url: 'nu-e-url' }).success).toBe(false);
  });

  it('implicit is_public false', () => {
    const r = PetMemorialSchema.safeParse({ pet_name: 'Rex', passed_at: '2025-06-01' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.is_public).toBe(false);
  });
});

describe('planCompleteness + checklist', () => {
  it('plan complet = 100', () => {
    expect(planCompleteness(makePlan())).toBe(100);
    expect(isPlanReady(makePlan())).toBe(true);
    expect(planChecklist(makePlan()).every((i) => i.done)).toBe(true);
  });

  it('plan gol = 0 și nu e ready', () => {
    const empty = makePlan({
      guardian_name: '',
      guardian_phone: null,
      instructions: null,
      care_budget_cents: null,
      wishes: null,
    });
    expect(planCompleteness(empty)).toBe(0);
    expect(isPlanReady(empty)).toBe(false);
  });

  it('doar guardian → 35', () => {
    const p = makePlan({
      guardian_name: 'Maria',
      guardian_phone: null,
      instructions: null,
      care_budget_cents: null,
      wishes: null,
    });
    expect(planCompleteness(p)).toBe(35);
  });

  it('contact prin email satisface componenta phone', () => {
    const p = makePlan({ guardian_phone: null, guardian_email: 'a@b.ro' });
    const phone = planChecklist(p).find((i) => i.key === 'phone');
    expect(phone?.done).toBe(true);
  });

  it('pragul ready este 90', () => {
    expect(LEGACY_READY_THRESHOLD).toBe(90);
  });
});

describe('daysSincePassed + anniversary', () => {
  it('calculează zilele de la trecere', () => {
    expect(daysSincePassed(makeMemorial({ passed_at: '2025-06-01' }), NOW)).toBe(379);
  });

  it('aniversare viitoare în aceeași zi calendaristică', () => {
    // trecere 2025-06-20 → următoarea aniversare 2026-06-20 → 5 zile
    expect(daysToAnniversary(makeMemorial({ passed_at: '2025-06-20' }), NOW)).toBe(5);
  });

  it('aniversare trecută anul acesta → anul viitor', () => {
    // trecere 2024-06-01 → aniversarea 2026 a trecut acum 14 zile → următoarea în 351 zile
    expect(daysToAnniversary(makeMemorial({ passed_at: '2024-06-01' }), NOW)).toBe(351);
  });

  it('aniversare azi = 0', () => {
    expect(daysToAnniversary(makeMemorial({ passed_at: '2024-06-15' }), NOW)).toBe(0);
  });
});

describe('sortări', () => {
  it('memorii: cele mai recente primele', () => {
    const sorted = sortMemorials([
      makeMemorial({ id: 'old', passed_at: '2020-01-01' }),
      makeMemorial({ id: 'new', passed_at: '2026-01-01' }),
    ]);
    expect(sorted.map((m) => m.id)).toEqual(['new', 'old']);
  });

  it('planuri: cele mai incomplete primele', () => {
    const sorted = sortPlansByCompleteness([
      makePlan({ id: 'complet' }),
      makePlan({ id: 'gol', guardian_name: '', guardian_phone: null, instructions: null, care_budget_cents: null, wishes: null }),
    ]);
    expect(sorted[0].id).toBe('gol');
  });
});
