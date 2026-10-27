/**
 * Teste PetEdu — articole educaționale + traineri.
 * Acoperă: validare Zod trainer (nume, specializări, telefon, experiență),
 * filtre articole/traineri (cu diacritice RO), sortări, excerpt, edge cases.
 */
import {
  TrainerProfileSchema,
  TRAINER_PHONE_REGEX,
} from '../src/validation/edu';
import {
  filterEduArticles,
  eduArticleCategories,
  sortEduArticles,
  filterTrainers,
  sortTrainers,
  bioExcerpt,
  eduSpeciesKey,
  hasSpecialty,
} from '../src/utils/edu';
import type { EduArticle, Trainer, TrainerSpecialty } from '../src/types/edu';

// ---------- factory ----------

function article(partial: Partial<EduArticle> & { id: string }): EduArticle {
  return {
    title: 'Titlu',
    body: 'Corpul articolului.',
    species: 'general',
    category: null,
    created_by: null,
    created_at: '2025-01-01T10:00:00Z',
    ...partial,
  };
}

function trainer(partial: Partial<Trainer> & { id: string; user_id: string }): Trainer {
  return {
    display_name: 'Ion Dresor',
    specialties: ['obedience'],
    city: null,
    bio: null,
    experience_years: 3,
    phone: null,
    price_range: null,
    photo_url: null,
    verified: false,
    active: true,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    ...partial,
  };
}

// ---------- validare profil trainer ----------

describe('TrainerProfileSchema', () => {
  const valid = {
    display_name: 'Maria Pop',
    specialties: ['obedience', 'puppy'],
    experience_years: 5,
  };

  it('acceptă un profil minim valid', () => {
    const r = TrainerProfileSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('transformă opționalele goale în null', () => {
    const r = TrainerProfileSchema.safeParse({
      ...valid,
      city: '  ',
      bio: '',
      phone: '',
      price_range: undefined,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.city).toBeNull();
      expect(r.data.bio).toBeNull();
      expect(r.data.phone).toBeNull();
      expect(r.data.price_range).toBeNull();
    }
  });

  it('respinge numele sub 2 caractere', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, display_name: 'A' });
    expect(r.success).toBe(false);
  });

  it('respinge numele peste 60 de caractere', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, display_name: 'x'.repeat(61) });
    expect(r.success).toBe(false);
  });

  it('respinge lista goală de specializări', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, specialties: [] });
    expect(r.success).toBe(false);
  });

  it('respinge specializările necunoscute', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, specialties: ['yoga'] });
    expect(r.success).toBe(false);
  });

  it('respinge specializările duplicate', () => {
    const r = TrainerProfileSchema.safeParse({
      ...valid,
      specialties: ['obedience', 'obedience'],
    });
    expect(r.success).toBe(false);
  });

  it('respinge peste 6 specializări', () => {
    const r = TrainerProfileSchema.safeParse({
      ...valid,
      specialties: [
        'obedience',
        'behavior',
        'agility',
        'puppy',
        'protection',
        'therapy',
        'obedience',
      ].slice(0, 7),
    });
    expect(r.success).toBe(false);
  });

  it('respinge experiența negativă', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, experience_years: -1 });
    expect(r.success).toBe(false);
  });

  it('respinge experiența peste 60', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, experience_years: 61 });
    expect(r.success).toBe(false);
  });

  it('respinge experiența fracționară', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, experience_years: 2.5 });
    expect(r.success).toBe(false);
  });

  it('respinge telefonul invalid', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, phone: 'abc-de' });
    expect(r.success).toBe(false);
  });

  it('acceptă telefonul RO cu prefix', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, phone: '+40 722 123 456' });
    expect(r.success).toBe(true);
  });

  it('respinge bio peste 600 caractere', () => {
    const r = TrainerProfileSchema.safeParse({ ...valid, bio: 'a'.repeat(601) });
    expect(r.success).toBe(false);
  });
});

describe('TRAINER_PHONE_REGEX', () => {
  it.each(['0722123456', '+40722123456', '0722 123 456', '(021) 123-4567'])(
    'acceptă %s',
    (phone) => {
      expect(TRAINER_PHONE_REGEX.test(phone)).toBe(true);
    }
  );

  it.each(['abc', '12', '0722#123', 'telefon@x'])('respinge %s', (phone) => {
    expect(TRAINER_PHONE_REGEX.test(phone)).toBe(false);
  });
});

// ---------- articole ----------

const ARTICLES: EduArticle[] = [
  article({ id: 'a1', title: 'Comanda Șezi', species: 'caine', category: 'dresaj' }),
  article({ id: 'a2', title: 'Litierea corectă', species: 'pisica', category: 'dresaj' }),
  article({ id: 'a3', title: 'Hrană toxică', species: 'general', category: 'alimentație' }),
  article({ id: 'a4', title: 'Vaccinuri pui', species: 'caine', category: 'sănătate' }),
];

describe('filterEduArticles', () => {
  it('filtează după specie', () => {
    const out = filterEduArticles(ARTICLES, { species: 'caine' });
    expect(out.map((a) => a.id)).toEqual(['a1', 'a4']);
  });

  it('filtează după categorie', () => {
    const out = filterEduArticles(ARTICLES, { category: 'dresaj' });
    expect(out.map((a) => a.id)).toEqual(['a1', 'a2']);
  });

  it('caută diacritice-insensibil (hrană → hrana)', () => {
    const out = filterEduArticles(ARTICLES, { search: 'hrana' });
    expect(out.map((a) => a.id)).toEqual(['a3']);
  });

  it('caută în titlu și corp', () => {
    const out = filterEduArticles(ARTICLES, { search: 'vaccinuri' });
    expect(out.map((a) => a.id)).toEqual(['a4']);
  });

  it('combină filtrele', () => {
    const out = filterEduArticles(ARTICLES, {
      species: 'caine',
      category: 'dresaj',
    });
    expect(out.map((a) => a.id)).toEqual(['a1']);
  });

  it('fără filtre returnează tot', () => {
    expect(filterEduArticles(ARTICLES, {})).toHaveLength(4);
  });
});

describe('eduArticleCategories', () => {
  it('returnează categorii unice în ordinea apariției', () => {
    expect(eduArticleCategories(ARTICLES)).toEqual(['dresaj', 'alimentație', 'sănătate']);
  });

  it('sari peste categoriile null', () => {
    expect(eduArticleCategories([article({ id: 'x', category: null })])).toEqual([]);
  });
});

describe('sortEduArticles', () => {
  it('pune „general" primul, restul cronologic descrescător', () => {
    const list = [
      article({ id: 'a', species: 'caine', created_at: '2025-03-01T00:00:00Z' }),
      article({ id: 'b', species: 'general', created_at: '2025-01-01T00:00:00Z' }),
      article({ id: 'c', species: 'pisica', created_at: '2025-02-01T00:00:00Z' }),
    ];
    expect(sortEduArticles(list).map((a) => a.id)).toEqual(['b', 'a', 'c']);
  });
});

// ---------- traineri ----------

const TRAINERS: Trainer[] = [
  trainer({
    id: 't1',
    user_id: 'u1',
    display_name: 'Ana Agilitate',
    specialties: ['agility', 'obedience'],
    city: 'Cluj',
    experience_years: 8,
    verified: true,
  }),
  trainer({
    id: 't2',
    user_id: 'u2',
    display_name: 'Dan Cățeluși',
    specialties: ['puppy'],
    city: 'cluj',
    experience_years: 2,
  }),
  trainer({
    id: 't3',
    user_id: 'u3',
    display_name: 'Eva Comportament',
    specialties: ['behavior'],
    bio: 'Specialist în anxietate de separare la câini',
    experience_years: 12,
  }),
  trainer({
    id: 't4',
    user_id: 'u4',
    display_name: 'Inactiv',
    specialties: ['obedience'],
    active: false,
  }),
];

describe('filterTrainers', () => {
  it('exclude trainerii inactivi', () => {
    expect(filterTrainers(TRAINERS, {})).toHaveLength(3);
  });

  it('filtează după specializare', () => {
    const out = filterTrainers(TRAINERS, { specialty: 'agility' });
    expect(out.map((t) => t.id)).toEqual(['t1']);
  });

  it('filtează după oraș case/diacritice-insensibil', () => {
    const out = filterTrainers(TRAINERS, { city: '  CLUJ ' });
    expect(out.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('caută în nume și bio', () => {
    const out = filterTrainers(TRAINERS, { search: 'anxietate' });
    expect(out.map((t) => t.id)).toEqual(['t3']);
  });

  it('trainer fără oraș e exclus la filtrarea pe oraș', () => {
    const out = filterTrainers(TRAINERS, { city: 'Cluj' });
    expect(out.find((t) => t.id === 't3')).toBeUndefined();
  });
});

describe('sortTrainers', () => {
  it('verificați → experiență desc → recent', () => {
    const sorted = sortTrainers([TRAINERS[1], TRAINERS[2], TRAINERS[0]]);
    expect(sorted.map((t) => t.id)).toEqual(['t1', 't3', 't2']);
  });

  it('nu mutiază lista originală', () => {
    const list = [TRAINERS[1], TRAINERS[0]];
    sortTrainers(list);
    expect(list[0].id).toBe('t2');
  });
});

// ---------- helpers ----------

describe('bioExcerpt', () => {
  it('returnează null pentru bio null', () => {
    expect(bioExcerpt(null)).toBeNull();
  });

  it('returnează bio complet dacă e scurt', () => {
    expect(bioExcerpt('Curat și clar', 120)).toBe('Curat și clar');
  });

  it('trunchiază fără a tăia cuvinte', () => {
    const out = bioExcerpt('cuvinte lungi roate pe spatiu mare', 12);
    expect(out!.endsWith('…')).toBe(true);
    expect(out).not.toContain('mare');
  });
});

describe('eduSpeciesKey', () => {
  it('mapează specii valide la ele însele', () => {
    expect(eduSpeciesKey('pisica')).toBe('pisica');
  });

  it('fallback la general pentru specii necunoscute', () => {
    expect(eduSpeciesKey('dinozaur')).toBe('general');
  });
});

describe('hasSpecialty', () => {
  it('verifică apartenența type-safe', () => {
    const specs: string[] = ['obedience', 'yoga'];
    expect(hasSpecialty(specs, 'obedience' as TrainerSpecialty)).toBe(true);
    expect(hasSpecialty(specs, 'agility' as TrainerSpecialty)).toBe(false);
  });
});
