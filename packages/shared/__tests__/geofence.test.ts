/**
 * Teste pentru utilitarele geofencing PetGuardian (matematică pură).
 */
import {
  haversineDistanceM,
  distanceToZoneCenterM,
  isInsideZone,
  zoneTransition,
  offsetPoint,
  formatDistanceHuman,
} from '../src/utils/geofence';
import { GuardianZoneSchema, GuardianPingSchema } from '../src/validation/guardian';

describe('geofence — haversineDistanceM', () => {
  it('puncte identice → 0 m', () => {
    expect(haversineDistanceM(44.4268, 26.1025, 44.4268, 26.1025)).toBe(0);
  });

  it('1 grad longitudine pe ecuator ≈ 111,2 km', () => {
    const d = haversineDistanceM(0, 0, 0, 1);
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it('București → Cluj ≈ 314–330 km', () => {
    const d = haversineDistanceM(44.4268, 26.1025, 46.7712, 23.6236);
    expect(d).toBeGreaterThan(300_000);
    expect(d).toBeLessThan(340_000);
  });

  it('coordonate invalide (NaN / Infinity) → Infinity', () => {
    expect(haversineDistanceM(NaN, 0, 0, 0)).toBe(Infinity);
    expect(haversineDistanceM(0, Infinity, 0, 0)).toBe(Infinity);
  });
});

describe('geofence — isInsideZone', () => {
  const zone = { center_lat: 44.4268, center_lng: 26.1025, radius_m: 500 };

  it('punct în centru → true', () => {
    expect(isInsideZone(44.4268, 26.1025, zone)).toBe(true);
  });

  it('punct la ~370 m (≈0,00333° lat) → true', () => {
    // 0.00333° * 111_195 m/deg ≈ 370 m
    expect(isInsideZone(44.43013, 26.1025, zone)).toBe(true);
  });

  it('punct la ~740 m → false', () => {
    expect(isInsideZone(44.43346, 26.1025, zone)).toBe(false);
  });

  it('marginea GPS: accuracy mare poate duce punctul „pe muchie" în interior', () => {
    // la ~740 m, cu accuracy 100 m rămâne în exterior
    expect(isInsideZone(44.43346, 26.1025, zone, 100)).toBe(false);
  });

  it('rază invalidă → false (defensiv)', () => {
    expect(isInsideZone(44.4268, 26.1025, { center_lat: 0, center_lng: 0, radius_m: 0 })).toBe(false);
  });
});

describe('geofence — zoneTransition', () => {
  it('prima evaluare (null) → fără alertă', () => {
    expect(zoneTransition(null, true)).toBeNull();
    expect(zoneTransition(null, false)).toBeNull();
  });

  it('inside → outside = exit_zone', () => {
    expect(zoneTransition(true, false)).toBe('exit_zone');
  });

  it('outside → inside = enter_zone', () => {
    expect(zoneTransition(false, true)).toBe('enter_zone');
  });

  it('fără schimbare → null', () => {
    expect(zoneTransition(true, true)).toBeNull();
    expect(zoneTransition(false, false)).toBeNull();
  });
});

describe('geofence — offsetPoint (simulare mișcare)', () => {
  it('deplasare 0 m → același punct', () => {
    const p = offsetPoint(44.4268, 26.1025, 90, 0);
    expect(p.lat).toBeCloseTo(44.4268, 5);
    expect(p.lng).toBeCloseTo(26.1025, 5);
  });

  it('deplasare 100 m spre est crește longitudinea', () => {
    const p = offsetPoint(44.4268, 26.1025, 90, 100);
    expect(p.lng).toBeGreaterThan(26.1025);
    expect(haversineDistanceM(44.4268, 26.1025, p.lat, p.lng)).toBeGreaterThan(90);
    expect(haversineDistanceM(44.4268, 26.1025, p.lat, p.lng)).toBeLessThan(110);
  });

  it('longitudinea rămâne normalizată în [-180, 180]', () => {
    const p = offsetPoint(0, 179.999, 90, 500);
    expect(p.lng).toBeGreaterThanOrEqual(-180);
    expect(p.lng).toBeLessThanOrEqual(180);
  });
});

describe('geofence — formatDistanceHuman', () => {
  it('sub 1 km → metri rotunjiți', () => {
    expect(formatDistanceHuman(349.4)).toBe('349 m');
  });

  it('peste 1 km → km cu virgulă', () => {
    expect(formatDistanceHuman(1234)).toBe('1,2 km');
  });

  it('null / NaN → „—"', () => {
    expect(formatDistanceHuman(null)).toBe('—');
    expect(formatDistanceHuman(NaN)).toBe('—');
  });
});

describe('validation — GuardianZoneSchema', () => {
  const base = { name: 'Acasă', center_lat: 44.4268, center_lng: 26.1025, radius_m: 300 };

  it('acceptă o zonă validă', () => {
    const r = GuardianZoneSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('respinge raza sub 50 m și peste 5000 m', () => {
    expect(GuardianZoneSchema.safeParse({ ...base, radius_m: 49 }).success).toBe(false);
    expect(GuardianZoneSchema.safeParse({ ...base, radius_m: 5001 }).success).toBe(false);
  });

  it('respinge latitudini/longitudini în afara intervalului', () => {
    expect(GuardianZoneSchema.safeParse({ ...base, center_lat: 91 }).success).toBe(false);
    expect(GuardianZoneSchema.safeParse({ ...base, center_lng: -181 }).success).toBe(false);
  });

  it('respinge nume prea scurte/prea lungi', () => {
    expect(GuardianZoneSchema.safeParse({ ...base, name: 'A' }).success).toBe(false);
    expect(GuardianZoneSchema.safeParse({ ...base, name: 'x'.repeat(41) }).success).toBe(false);
  });
});

describe('validation — GuardianPingSchema', () => {
  it('acceptă un ping valid', () => {
    const r = GuardianPingSchema.safeParse({
      pet_id: '123e4567-e89b-42d3-a456-426614174000',
      lat: 44.4268,
      lng: 26.1025,
      source: 'gps',
    });
    expect(r.success).toBe(true);
  });

  it('respinge pet_id care nu e UUID', () => {
    const r = GuardianPingSchema.safeParse({ pet_id: 'abc', lat: 1, lng: 1, source: 'gps' });
    expect(r.success).toBe(false);
  });

  it('respinge surse necunoscute', () => {
    const r = GuardianPingSchema.safeParse({
      pet_id: '123e4567-e89b-42d3-a456-426614174000',
      lat: 1,
      lng: 1,
      source: 'magic',
    });
    expect(r.success).toBe(false);
  });
});
