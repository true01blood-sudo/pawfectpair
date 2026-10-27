/**
 * Teste cadrul legal OUG 55/2002 — detectare rase periculoase/agresive + checklist.
 */
import {
  normalizeBreedName,
  detectOug50Category,
  oug50Requirements,
  oug50ChecklistActions,
  oug50Compliance,
  OUG50_ACTION_COLUMN,
} from '../src/utils/oug50';
import { OUG50_CAT1_BREEDS, OUG50_CAT2_BREEDS, PEDIGREE_REGISTRIES } from '../src/constants/pet';

describe('normalizeBreedName', () => {
  it('elimină diacritice și normalizază spațiile', () => {
    expect(normalizeBreedName('Ciobănesc  Caucazian')).toBe('ciobanesc caucazian');
  });

  it('elimină punctuația', () => {
    expect(normalizeBreedName('Pit-Bull (Terrier)')).toBe('pit bull terrier');
  });

  it('null/undefined → string gol', () => {
    expect(normalizeBreedName(null)).toBe('');
    expect(normalizeBreedName(undefined)).toBe('');
  });
});

describe('detectOug50Category — Categoria I', () => {
  it.each(OUG50_CAT1_BREEDS)('%s → categoria 1', (b) => {
    expect(detectOug50Category(b)).toBe(1);
  });

  it('variante scrise de utilizatori', () => {
    expect(detectOug50Category('pitbull')).toBe(1);
    expect(detectOug50Category('Pit Bull Terrier American')).toBe(1);
    expect(detectOug50Category('metis pitbull')).toBe(1);
    expect(detectOug50Category('boer Bull')).toBe(1);
  });
});

describe('detectOug50Category — Categoria II', () => {
  it.each(OUG50_CAT2_BREEDS)('%s → categoria 2', (b) => {
    expect(detectOug50Category(b)).toBe(2);
  });

  it('variante scrise de utilizatori', () => {
    expect(detectOug50Category('amstaff')).toBe(2);
    expect(detectOug50Category('Rottweiller')).toBe(2);
    expect(detectOug50Category('Dog Argentinian')).toBe(2);
    expect(detectOug50Category('Dogo Argentino')).toBe(2);
    expect(detectOug50Category('Tosa Inu')).toBe(2);
    expect(detectOug50Category('Ciobanesc Caucasian')).toBe(2);
    expect(detectOug50Category('Neapolitan Mastiff')).toBe(2);
    expect(detectOug50Category('English Mastiff')).toBe(2);
  });
});

describe('detectOug50Category — rase care NU sunt incadrate', () => {
  it('rase obișnuite → 0', () => {
    expect(detectOug50Category('Labrador')).toBe(0);
    expect(detectOug50Category('Golden Retriever')).toBe(0);
    expect(detectOug50Category('Bichon Maltez')).toBe(0);
    expect(detectOug50Category('Metic')).toBe(0);
    expect(detectOug50Category('Corcitură fericită')).toBe(0);
  });

  it('Staffordshire Bull Terrier (nu e în listă) → 0', () => {
    // Staffy Bull Terrier NU figurează în OUG 55/2002
    expect(detectOug50Category('Staffordshire Bull Terrier')).toBe(0);
  });

  it('vid / gol → 0', () => {
    expect(detectOug50Category(null)).toBe(0);
    expect(detectOug50Category('')).toBe(0);
    expect(detectOug50Category('   ')).toBe(0);
  });
});

describe('cadrul legal per categorie', () => {
  it('categoria I include restricții de acces', () => {
    const reqs = oug50Requirements(1);
    const ids = reqs.map((r) => r.id);
    expect(ids).toContain('no_public_venues');
    expect(ids).toContain('muzzle_leash');
  });

  it('categoria II NU include restricțiile de acces ale cat. I', () => {
    const ids = oug50Requirements(2).map((r) => r.id);
    expect(ids).not.toContain('no_public_venues');
    expect(ids).toContain('muzzle_leash');
  });

  it('toate categoriile au acțiunile de bază bifabile', () => {
    for (const c of [1, 2] as const) {
      const actions = oug50ChecklistActions(c);
      expect(actions).toContain('owner_18');
      expect(actions).toContain('registration');
      expect(actions).toContain('microchip');
      expect(actions).toContain('insurance');
      expect(actions).toContain('sign');
    }
  });

  it('fiecare cerință are referință legală', () => {
    for (const c of [1, 2] as const) {
      for (const r of oug50Requirements(c)) {
        expect(r.legalRef.length).toBeGreaterThan(3);
      }
    }
  });
});

describe('oug50Compliance', () => {
  it('toate bifate → complete', () => {
    const pet = {
      oug50_owner_18: true,
      oug50_registration: true,
      oug50_microchip: true,
      oug50_insurance: true,
      oug50_sign: true,
      oug50_sterilized: true,
    };
    const c = oug50Compliance(pet, 2);
    expect(c.complete).toBe(true);
    expect(c.missing).toHaveLength(0);
  });

  it('lipsuri detectate corect', () => {
    const c = oug50Compliance({ oug50_owner_18: true, oug50_microchip: true }, 1);
    expect(c.done).toBe(2);
    expect(c.total).toBe(6);
    expect(c.complete).toBe(false);
    expect(c.missing).toContain('registration');
  });

  it('mapare acțiune → coloană DB', () => {
    expect(OUG50_ACTION_COLUMN.owner_18).toBe('oug50_owner_18');
    expect(OUG50_ACTION_COLUMN.sterilized).toBe('oug50_sterilized');
  });
});

describe('registre pedigree', () => {
  it('lista registrelor conține LRC și FCI', () => {
    expect(PEDIGREE_REGISTRIES).toContain('LRC');
    expect(PEDIGREE_REGISTRIES).toContain('FCI');
  });
});
