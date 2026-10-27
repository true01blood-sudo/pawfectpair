/**
 * Teste pentru validarea Adopții (anunțuri + aplicații).
 */
import {
  AdoptionListingSchema,
  AdoptionApplicationSchema,
  ApplicationStatusSchema,
  AdoptionStatusSchema,
} from '../src/validation/adoptii';

const validListing = {
  name: 'Rex',
  species: 'Câine',
  sex: 'male',
  size: 'medium',
};

describe('adoptii — AdoptionListingSchema', () => {
  it('input minim valid trece + transformă optionalele în null', () => {
    const r = AdoptionListingSchema.safeParse(validListing);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.breed).toBeNull();
      expect(r.data.description).toBeNull();
      expect(r.data.city).toBeNull();
      expect(r.data.photo_url).toBeNull();
    }
  });

  it('input complet trece', () => {
    const r = AdoptionListingSchema.safeParse({
      ...validListing,
      breed: 'Metiș',
      age_years: 2.5,
      description: 'Jucăuș și prietenos',
      city: 'București',
      photo_url: 'https://example.com/rex.jpg',
    });
    expect(r.success).toBe(true);
  });

  it('nume prea scurt / prea lung respins', () => {
    expect(AdoptionListingSchema.safeParse({ ...validListing, name: ' R ' }).success).toBe(false);
    expect(AdoptionListingSchema.safeParse({ ...validListing, name: 'x'.repeat(51) }).success).toBe(false);
  });

  it('specie invalidă respinsă', () => {
    expect(AdoptionListingSchema.safeParse({ ...validListing, species: 'Dinozaur' }).success).toBe(false);
  });

  it('sex / mărime invalide respinse', () => {
    expect(AdoptionListingSchema.safeParse({ ...validListing, sex: 'x' }).success).toBe(false);
    expect(AdoptionListingSchema.safeParse({ ...validListing, size: 'huge' }).success).toBe(false);
  });

  it('vârstă negativă / nerealistă respinsă', () => {
    expect(AdoptionListingSchema.safeParse({ ...validListing, age_years: -1 }).success).toBe(false);
    expect(AdoptionListingSchema.safeParse({ ...validListing, age_years: 99 }).success).toBe(false);
  });

  it('descriere > 1000 caractere respinsă', () => {
    expect(
      AdoptionListingSchema.safeParse({ ...validListing, description: 'a'.repeat(1001) }).success
    ).toBe(false);
  });

  it('photo_url non-http respins; string gol → null', () => {
    expect(
      AdoptionListingSchema.safeParse({ ...validListing, photo_url: 'javascript:alert(1)' }).success
    ).toBe(false);
    const r = AdoptionListingSchema.safeParse({ ...validListing, photo_url: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.photo_url).toBeNull();
  });
});

describe('adoptii — AdoptionApplicationSchema', () => {
  const LISTING = '44444444-4444-4444-4444-444444444444';

  it('aplicație validă (cu și fără mesaj)', () => {
    expect(AdoptionApplicationSchema.safeParse({ listing_id: LISTING }).success).toBe(true);
    expect(
      AdoptionApplicationSchema.safeParse({ listing_id: LISTING, message: 'Vreau să-l adopt!' }).success
    ).toBe(true);
  });

  it('listing_id invalid respins', () => {
    expect(AdoptionApplicationSchema.safeParse({ listing_id: 'abc' }).success).toBe(false);
  });

  it('mesaj > 500 caractere respins', () => {
    expect(
      AdoptionApplicationSchema.safeParse({ listing_id: LISTING, message: 'a'.repeat(501) }).success
    ).toBe(false);
  });
});

describe('adoptii — enum statusuri', () => {
  it('statusuri anunț valide/invalide', () => {
    expect(AdoptionStatusSchema.safeParse('available').success).toBe(true);
    expect(AdoptionStatusSchema.safeParse('deleted').success).toBe(false);
  });

  it('statusuri aplicație valide/invalide', () => {
    expect(ApplicationStatusSchema.safeParse('pending').success).toBe(true);
    expect(ApplicationStatusSchema.safeParse('accepted').success).toBe(true);
    expect(ApplicationStatusSchema.safeParse('maybe').success).toBe(false);
  });
});
