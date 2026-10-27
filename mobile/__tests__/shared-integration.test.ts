/**
 * Test de integrare cu shared — schema Pet + utils reutilizabile.
 * Demonstrează că monorepo-ul funcționează corect în mobile.
 */
import { PetSchema, MedicalRecordSchema, LoginSchema } from '@pawfectpair/shared';
import { calcAge, formatDateRO, timeAgoRO, initials } from '@pawfectpair/shared';

describe('Shared package integration', () => {
  it('importă corect schemele Zod', () => {
    const valid = PetSchema.safeParse({
      name: 'Rex',
      species: 'Câine',
      sex: 'male',
    });
    expect(valid.success).toBe(true);
  });

  it('schema medical — scadență înainte de eveniment este respinsă', () => {
    const r = MedicalRecordSchema.safeParse({
      pet_id: '12345678-1234-1234-1234-123456789012',
      type: 'vaccinare',
      title: 'Rabie',
      record_date: '2026-10-26',
      due_date: '2020-01-01', // înainte de eveniment → invalid
    });
    expect(r.success).toBe(false);
  });

  it('login schema — email obligatoriu', () => {
    const r = LoginSchema.safeParse({ email: '', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('utils — calcAge returnează vârsta corectă', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-26'));
    const age = calcAge('2020-05-10');
    expect(age?.years).toBe(6);
    jest.useRealTimers();
  });

  it('utils — formatDateRO în limba română', () => {
    expect(formatDateRO('2026-10-26')).toBe('26 oct. 2026');
  });

  it('utils — timeAgoRO la 5 minute', () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgoRO(iso)).toBe('acum 5 min');
  });

  it('utils — initials pentru avatar fallback', () => {
    expect(initials('Andrei Popa')).toBe('AP');
  });
});
