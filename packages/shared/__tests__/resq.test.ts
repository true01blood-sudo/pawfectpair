/**
 * Teste PetResQ — validare Zod + utils cazuri pierdut/găsit.
 */
import {
  ResqCaseSchema,
  ResqTipSchema,
  ResqStatusSchema,
} from '../src/validation/resq';
import {
  filterResqCases,
  sortResqCases,
  caseAgeDays,
  isCaseStale,
  countResqByType,
  resqTypeKey,
  resqStatusKey,
  RESQ_STALE_DAYS,
} from '../src/utils/resq';
import type { ResqCaseWithReporter } from '../src/types/resq';

const NOW = new Date('2026-06-15T10:00:00Z');

function makeCase(overrides: Partial<ResqCaseWithReporter> = {}): ResqCaseWithReporter {
  return {
    id: 'c1',
    reporter_id: '11111111-1111-1111-1111-111111111111',
    pet_id: null,
    type: 'lost',
    name: 'Rex',
    species: 'caine',
    description: 'Câine mediu, blănă maro, are zgardă roșie.',
    city: 'București',
    last_seen_location: 'Parc Tineretului',
    contact_phone: '0722111222',
    photo_url: null,
    status: 'active',
    created_at: '2026-06-10T00:00:00Z',
    updated_at: '2026-06-10T00:00:00Z',
    ...overrides,
  };
}

describe('ResqCaseSchema', () => {
  const valid = {
    type: 'lost',
    name: 'Rex',
    species: 'caine',
    description: 'A dispărut seara de lângă bloc, răspunde la nume.',
    city: 'Cluj-Napoca',
  };

  it('acceptă un caz valid', () => {
    expect(ResqCaseSchema.safeParse(valid).success).toBe(true);
  });

  it('acceptă un caz „găsit"', () => {
    expect(ResqCaseSchema.safeParse({ ...valid, type: 'found' }).success).toBe(true);
  });

  it('respunde tip necunoscut', () => {
    expect(ResqCaseSchema.safeParse({ ...valid, type: 'sold' }).success).toBe(false);
  });

  it('respunde nume prea scurt', () => {
    expect(ResqCaseSchema.safeParse({ ...valid, name: 'R' }).success).toBe(false);
  });

  it('respunde descriere sub 10 caractere', () => {
    expect(
      ResqCaseSchema.safeParse({ ...valid, description: 'scurt' }).success
    ).toBe(false);
  });

  it('transformă orașul gol în null', () => {
    const r = ResqCaseSchema.safeParse({ ...valid, city: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.city).toBeNull();
  });

  it('respunde telefon invalid', () => {
    expect(
      ResqCaseSchema.safeParse({ ...valid, contact_phone: 'abc123' }).success
    ).toBe(false);
  });

  it('acceptă telefon RO valid', () => {
    const r = ResqCaseSchema.safeParse({ ...valid, contact_phone: '0722 111 222' });
    expect(r.success).toBe(true);
  });

  it('respunde specie necunoscută', () => {
    expect(ResqCaseSchema.safeParse({ ...valid, species: 'dinozaur' }).success).toBe(false);
  });

  it('respunde descriere peste 1000 caractere', () => {
    expect(
      ResqCaseSchema.safeParse({ ...valid, description: 'x'.repeat(1001) }).success
    ).toBe(false);
  });
});

describe('ResqTipSchema', () => {
  const valid = {
    case_id: '22222222-2222-2222-2222-222222222222',
    message: 'Am văzut un câine ca el în parc, azi dimineață.',
  };

  it('acceptă un sfat valid', () => {
    expect(ResqTipSchema.safeParse(valid).success).toBe(true);
  });

  it('respunde mesaj sub 2 caractere', () => {
    expect(ResqTipSchema.safeParse({ ...valid, message: ' ' }).success).toBe(false);
  });

  it('respunde mesaj peste 500 caractere', () => {
    expect(ResqTipSchema.safeParse({ ...valid, message: 'a'.repeat(501) }).success).toBe(false);
  });

  it('respunde case_id invalid', () => {
    expect(ResqTipSchema.safeParse({ ...valid, case_id: 'xyz' }).success).toBe(false);
  });
});

describe('ResqStatusSchema', () => {
  it('acceptă active și resolved', () => {
    expect(ResqStatusSchema.safeParse('active').success).toBe(true);
    expect(ResqStatusSchema.safeParse('resolved').success).toBe(true);
  });

  it('respinge alte statusuri', () => {
    expect(ResqStatusSchema.safeParse('closed').success).toBe(false);
  });
});

describe('filterResqCases', () => {
  const cases = [
    makeCase({ id: 'a', type: 'lost', city: 'București' }),
    makeCase({ id: 'b', type: 'found', city: 'Cluj-Napoca', species: 'pisica', name: 'Mimi', last_seen_location: null }),
    makeCase({ id: 'c', type: 'lost', city: 'Iași', status: 'resolved', name: 'Luna', last_seen_location: null }),
  ];

  it('filtează după tip', () => {
    expect(filterResqCases(cases, { type: 'found' }).map((c) => c.id)).toEqual(['b']);
  });

  it('filtează după status', () => {
    const r = filterResqCases(cases, { status: 'resolved' });
    expect(r.map((c) => c.id)).toEqual(['c']);
  });

  it('filtează oraș cu potrivire parțială diacritice-insensibilă', () => {
    expect(filterResqCases(cases, { city: 'bucuresti' }).map((c) => c.id)).toEqual(['a']);
  });

  it('căutare în nume/descriere/locație', () => {
    expect(filterResqCases(cases, { search: 'rex' }).length).toBe(1);
    expect(filterResqCases(cases, { search: 'tineretului' }).length).toBe(1);
  });

  it('combinații filtre', () => {
    expect(filterResqCases(cases, { type: 'lost', status: 'active' }).length).toBe(1);
  });
});

describe('sortResqCases', () => {
  it('active primele (recente primele), rezolvate la final', () => {
    const cases = [
      makeCase({ id: 'rez-v', status: 'resolved', created_at: '2026-06-14T00:00:00Z' }),
      makeCase({ id: 'act-v', created_at: '2026-06-14T00:00:00Z' }),
      makeCase({ id: 'act-s', created_at: '2026-06-01T00:00:00Z' }),
    ];
    const sorted = sortResqCases(cases, NOW);
    expect(sorted.map((c) => c.id)).toEqual(['act-v', 'act-s', 'rez-v']);
  });
});

describe('caseAgeDays + isCaseStale', () => {
  it('calculează vârsta în zile', () => {
    expect(caseAgeDays(makeCase({ created_at: '2026-06-10T00:00:00Z' }), NOW)).toBe(5);
  });

  it('nu e stale sub prag', () => {
    expect(isCaseStale(makeCase({ created_at: '2026-06-10T00:00:00Z' }), NOW)).toBe(false);
  });

  it('stale la 30+ zile active', () => {
    const c = makeCase({ created_at: '2026-05-01T00:00:00Z' });
    expect(caseAgeDays(c, NOW)).toBeGreaterThanOrEqual(RESQ_STALE_DAYS);
    expect(isCaseStale(c, NOW)).toBe(true);
  });

  it('rezolvat nu poate fi stale', () => {
    expect(
      isCaseStale(makeCase({ status: 'resolved', created_at: '2026-01-01T00:00:00Z' }), NOW)
    ).toBe(false);
  });
});

describe('countResqByType', () => {
  it('numără doar activele', () => {
    const cases = [
      makeCase({ id: '1', type: 'lost' }),
      makeCase({ id: '2', type: 'lost', status: 'resolved' }),
      makeCase({ id: '3', type: 'found' }),
    ];
    const r = countResqByType(cases);
    expect(r.lost).toBe(1);
    expect(r.found).toBe(1);
  });
});

describe('chei sigure', () => {
  it('resqTypeKey fallback la lost', () => {
    expect(resqTypeKey('lost')).toBe('lost');
    expect(resqTypeKey('found')).toBe('found');
    expect(resqTypeKey('altele')).toBe('lost');
  });

  it('resqStatusKey fallback la active', () => {
    expect(resqStatusKey('resolved')).toBe('resolved');
    expect(resqStatusKey('ceva')).toBe('active');
  });
});
