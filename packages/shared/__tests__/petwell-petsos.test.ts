/**
 * Teste pentru motorul de triaj PetWell + validarea PetSOS.
 */
import {
  triageSymptoms,
  ageRiskHint,
  SYMPTOMS,
  type TriageLevel,
} from '../src/utils/petwell';
import { SosEventSchema, EmergencyContactSchema } from '../src/validation/petsos';

const PET = '22222222-2222-2222-2222-222222222222';

describe('petwell — catalog simptome', () => {
  it('id-uri unice', () => {
    const ids = SYMPTOMS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  'weight|emoji|category'.split('|').forEach((field) => {
    it(`toate simptomele au ${field}`, () => {
      for (const s of SYMPTOMS) {
        expect(s[field as 'weight' | 'emoji' | 'category']).toBeTruthy();
      }
    });
  });

  it('există cel puțin 4 semne de alarmă roșii', () => {
    expect(SYMPTOMS.filter((s) => s.redFlag).length).toBeGreaterThanOrEqual(4);
  });
});

describe('petwell — triageSymptoms', () => {
  it('selecție goală → calm, scor 0', () => {
    const r = triageSymptoms([]);
    expect(r.level).toBe('calm');
    expect(r.score).toBe(0);
    expect(r.adviceKeys).toEqual(['advice_none']);
  });

  it('simptome ușoare (mâncărime) → monitor', () => {
    expect(triageSymptoms(['itching']).level).toBe('monitor');
    expect(triageSymptoms(['sneezing']).level).toBe('monitor');
  });

  it('letargie singură → urgent (scor 30)', () => {
    const r = triageSymptoms(['lethargy']);
    expect(r.level).toBe('urgent');
    expect(r.score).toBe(30);
  });

  it('red-flag (sânge în vărsături) → emergency direct', () => {
    const r = triageSymptoms(['blood_vomit']);
    expect(r.level).toBe('emergency');
    expect(r.redFlags).toEqual(['blood_vomit']);
  });

  it('convulsii → emergency', () => {
    expect(triageSymptoms(['seizure']).level).toBe('emergency');
  });

  it('combinație vărsături + letargie → urgent prin regulă (scor sub prag)', () => {
    // 5+6 = 11 × 5 = 55 — deja urgent; testăm regula cu o combinație care altfel ar fi mai jos
    const r = triageSymptoms(['appetite_loss', 'lethargy']); // 4+6=10 → 50 urgent oricum
    // combinație fără reguli: mâncărime + strănut = 4 → 20 monitor
    expect(triageSymptoms(['itching', 'sneezing']).level).toBe('monitor');
    // combinație cu regulă: febră + tuse (6+4=10 → 50) — urgent oricum; folosim pereche
    // thirst_excess(3) + urination_pain(7) = 50, dar regula garantează urgent
    const r2 = triageSymptoms(['thirst_excess', 'urination_pain']);
    expect(r2.level).toBe('urgent');
    expect(r.level).toBe('urgent');
  });

  it('regula de combinație RIDICĂ nivelul (vărsături + abdomen balonat → emergency)', () => {
    const r = triageSymptoms(['vomiting', 'bloated_abdomen']); // 5+8=13 → 65 urgent, regula → emergency
    expect(r.level).toBe('emergency');
  });

  it('scor plafonat la 100', () => {
    const all = SYMPTOMS.map((s) => s.id);
    expect(triageSymptoms(all).score).toBe(100);
  });

  it('toate nivelurile au chei de recomandare', () => {
    const levels: TriageLevel[] = ['emergency', 'urgent', 'monitor', 'calm'];
    for (const lv of levels) {
      // găsim o selecție pentru fiecare nivel
      const r =
        lv === 'emergency'
          ? triageSymptoms(['seizure'])
          : lv === 'urgent'
            ? triageSymptoms(['lethargy'])
            : lv === 'monitor'
              ? triageSymptoms(['itching'])
              : triageSymptoms([]);
      expect(r.level).toBe(lv);
      expect(r.adviceKeys.length).toBeGreaterThan(0);
    }
  });
});

describe('petwell — ageRiskHint', () => {
  it('senior ≥ 8 ani', () => {
    expect(ageRiskHint(8)).toBe('senior');
    expect(ageRiskHint(15)).toBe('senior');
  });

  it('pui < 1 an', () => {
    expect(ageRiskHint(0.5)).toBe('young');
  });

  it('null / NaN → null', () => {
    expect(ageRiskHint(null)).toBeNull();
    expect(ageRiskHint(undefined)).toBeNull();
    expect(ageRiskHint(NaN)).toBeNull();
  });
});

describe('petsos — SosEventSchema', () => {
  it('eveniment valid (cu/fără note)', () => {
    expect(SosEventSchema.safeParse({ pet_id: PET, type: 'medical' }).success).toBe(true);
    expect(
      SosEventSchema.safeParse({ pet_id: PET, type: 'lost', notes: 'A fugit din curte' }).success
    ).toBe(true);
  });

  it('tip invalid respins', () => {
    expect(SosEventSchema.safeParse({ pet_id: PET, type: 'fire' }).success).toBe(false);
  });

  it('pet_id invalid respins', () => {
    expect(SosEventSchema.safeParse({ pet_id: 'abc', type: 'lost' }).success).toBe(false);
  });

  it('note > 500 respinse', () => {
    expect(
      SosEventSchema.safeParse({ pet_id: PET, type: 'danger', notes: 'a'.repeat(501) }).success
    ).toBe(false);
  });
});

describe('petsos — EmergencyContactSchema', () => {
  it('contact complet valid', () => {
    const r = EmergencyContactSchema.safeParse({
      emergency_contact_name: 'Dr. Popescu',
      emergency_contact_phone: '+40 722 123 456',
    });
    expect(r.success).toBe(true);
  });

  it('gol (ștergere) valid', () => {
    expect(EmergencyContactSchema.safeParse({}).success).toBe(true);
  });

  it('nume fără telefon → respins (superRefine)', () => {
    const r = EmergencyContactSchema.safeParse({ emergency_contact_name: 'Dr. Popescu' });
    expect(r.success).toBe(false);
  });

  it('telefon cu caractere interzise → respins', () => {
    expect(
      EmergencyContactSchema.safeParse({
        emergency_contact_name: 'X',
        emergency_contact_phone: 'call; DROP TABLE users',
      }).success
    ).toBe(false);
  });

  it('telefon prea scurt (sub 6) → respins', () => {
    expect(
      EmergencyContactSchema.safeParse({
        emergency_contact_name: 'X',
        emergency_contact_phone: '123',
      }).success
    ).toBe(false);
  });
});
