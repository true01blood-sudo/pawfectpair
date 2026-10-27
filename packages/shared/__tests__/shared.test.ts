import { PetSchema, LoginSchema, RegisterSchema, WeightLogSchema } from '../src';
import { calcAge } from '../src/utils/age';
import { daysUntil, formatDateRO, timeAgoRO } from '../src/utils/date';
import { initials, slugify } from '../src/utils/string';

describe('Auth validation', () => {
  it('validare login cu date corecte', () => {
    const r = LoginSchema.safeParse({ email: 'ion@example.com', password: 'parola123' });
    expect(r.success).toBe(true);
  });

  it('respinge email invalid', () => {
    const r = LoginSchema.safeParse({ email: 'nu-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('parola slabă este respinsă la înregistrare', () => {
    const r = RegisterSchema.safeParse({
      email: 'ion@example.com',
      password: 'scurta',
      confirmPassword: 'scurta',
      full_name: 'Ion',
      age_consent: true,
      terms_consent: true,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('minim 8'))).toBe(true);
    }
  });

  it('confirmare parolă greșită este respinsă', () => {
    const r = RegisterSchema.safeParse({
      email: 'ion@example.com',
      password: 'parola123',
      confirmPassword: 'alta123',
      full_name: 'Ion',
      age_consent: true,
      terms_consent: true,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('nu coincid'))).toBe(true);
    }
  });
});

describe('Pet validation', () => {
  const validPet = {
    name: 'Rex',
    species: 'Câine' as const,
    sex: 'male' as const,
    breed: 'Labrador',
    birth_date: '2020-05-10',
    notes: 'Cel mai bun câine',
  };

  it('acceptă animal valid', () => {
    expect(PetSchema.safeParse(validPet).success).toBe(true);
  });

  it('respinge nume gol', () => {
    expect(PetSchema.safeParse({ ...validPet, name: '' }).success).toBe(false);
  });

  it('respinge dată naștere în viitor', () => {
    expect(PetSchema.safeParse({ ...validPet, birth_date: '2999-01-01' }).success).toBe(false);
  });

  it('respinge specie invalidă', () => {
    expect(PetSchema.safeParse({ ...validPet, species: 'Elefant' as never }).success).toBe(false);
  });
});

describe('Weight log validation', () => {
  it('acceptă greutate validă', () => {
    expect(
      WeightLogSchema.safeParse({ pet_id: '12345678-1234-1234-1234-123456789012', weight_kg: 12.5, measured_at: '2026-10-01' }).success
    ).toBe(true);
  });

  it('respinge greutate negativă', () => {
    expect(
      WeightLogSchema.safeParse({ pet_id: '12345678-1234-1234-1234-123456789012', weight_kg: -5, measured_at: '2026-10-01' }).success
    ).toBe(false);
  });
});

describe('Utils', () => {
  it('calcAge — vârstă corectă în ani/luni', () => {
    const fixedNow = new Date('2026-10-26');
    jest.useFakeTimers().setSystemTime(fixedNow);
    const age = calcAge('2020-05-10');
    expect(age?.years).toBe(6);
    expect(age?.label).toContain('6 ani');
    jest.useRealTimers();
  });

  it('calcAge — null pentru date lipsă', () => {
    expect(calcAge(null)).toBeNull();
    expect(calcAge('invalid')).toBeNull();
  });

  it('formatDateRO — formatează corect', () => {
    expect(formatDateRO('2026-10-26')).toBe('26 oct. 2026');
    expect(formatDateRO(null)).toBe('—');
  });

  it('timeAgoRO — returnează relativ scurt', () => {
    const recent = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgoRO(recent)).toBe('acum 5 min');
  });

  it('daysUntil — pozitiv în viitor, negativ în trecut', () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const past = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    expect(daysUntil(future)).toBeGreaterThan(0);
    expect(daysUntil(past)).toBeLessThan(0);
  });

  it('initials — extrage initialele corecte', () => {
    expect(initials('Andrei Popa')).toBe('AP');
    expect(initials('Ion')).toBe('IO');
    expect(initials(null)).toBe('?');
  });

  it('slugify — normalizează diacritice și spații', () => {
    expect(slugify('Mâțulică & Rex')).toBe('matulica-rex');
  });
});
