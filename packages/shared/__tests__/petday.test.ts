/**
 * Teste utils + validare PetDay (pet-sitting / pet-hotel).
 */
import {
  PetDayListingSchema,
  PetDayBookingSchema,
  PETDAY_MAX_BOOKING_DAYS,
} from '../src/validation/petday';
import {
  filterPetdayListings,
  sortPetdayListings,
  sortPetdayBookings,
  bookingNights,
  bookingHours,
  overlapsRange,
  hasConflictingBooking,
  activeBookings,
  servicesSummary,
  canTransitionBooking,
  listingAccepts,
} from '../src/utils/petday';
import type { PetDayListing, PetDayBooking } from '../src/types/petday';

function listing(overrides: Partial<PetDayListing> = {}): PetDayListing {
  return {
    id: 'l1',
    user_id: 'u1',
    provider_type: 'sitter',
    title: 'Pet-sitter Cluj cu experiență',
    description: 'Îngrijire atentă la mine acasă',
    services: ['dog_walking', 'sitting_at_sitter'],
    city: 'Cluj-Napoca',
    address: null,
    price_from: 50,
    price_unit: 'day',
    max_pets: 3,
    accepts_dogs: true,
    accepts_cats: true,
    accepts_other: false,
    photo_url: null,
    phone: '0722333444',
    verified: false,
    active: true,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

function booking(overrides: Partial<PetDayBooking> = {}): PetDayBooking {
  return {
    id: 'b1',
    listing_id: 'l1',
    owner_id: 'o1',
    pet_id: null,
    starts_at: '2026-03-01T14:00:00Z',
    ends_at: '2026-03-03T14:00:00Z',
    note: null,
    status: 'pending',
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-02-20T10:00:00Z',
    ...overrides,
  };
}

describe('PetDayListingSchema', () => {
  it('acceptă o ofertă validă', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Hotel canin București',
      provider_type: 'center',
      services: ['boarding', 'daycare'],
      city: 'București',
      price_from: 80,
      price_unit: 'night',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.accepts_dogs).toBe(true);
      expect(r.data.max_pets).toBeNull();
    }
  });

  it('respinge titlul prea scurt', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'ab',
      provider_type: 'sitter',
      services: ['dog_walking'],
      city: 'Cluj-Napoca',
    });
    expect(r.success).toBe(false);
  });

  it('respinge fără niciun serviciu', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: [],
      city: 'Cluj-Napoca',
    });
    expect(r.success).toBe(false);
  });

  it('respinge servicii duplicate', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding', 'boarding'],
      city: 'Cluj-Napoca',
    });
    expect(r.success).toBe(false);
  });

  it('respinge dacă nu acceptă nicio specie', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding'],
      city: 'Cluj-Napoca',
      accepts_dogs: false,
      accepts_cats: false,
      accepts_other: false,
    });
    expect(r.success).toBe(false);
  });

  it('respinge telefon invalid', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding'],
      city: 'Cluj-Napoca',
      phone: 'abc',
    });
    expect(r.success).toBe(false);
  });

  it('acceptă telefon RO valid', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding'],
      city: 'Cluj-Napoca',
      phone: '+40 722 333 444',
    });
    expect(r.success).toBe(true);
  });

  it('transformă descrierea goală în null', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding'],
      city: 'Cluj-Napoca',
      description: '',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBeNull();
  });

  it('respinge preț negativ', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding'],
      city: 'Cluj-Napoca',
      price_from: -5,
    });
    expect(r.success).toBe(false);
  });

  it('respinge max_pets nenumerical', () => {
    const r = PetDayListingSchema.safeParse({
      title: 'Ofertă',
      provider_type: 'sitter',
      services: ['boarding'],
      city: 'Cluj-Napoca',
      max_pets: 2.5,
    });
    expect(r.success).toBe(false);
  });
});

describe('PetDayBookingSchema', () => {
  const base = {
    listing_id: '5f0a2d3c-1111-4222-8333-444455556666',
    starts_at: '2026-04-01T10:00:00Z',
    ends_at: '2026-04-03T10:00:00Z',
  };

  it('acceptă o rezervare validă', () => {
    expect(PetDayBookingSchema.safeParse(base).success).toBe(true);
  });

  it('respinge final înainte de început', () => {
    const r = PetDayBookingSchema.safeParse({
      ...base,
      starts_at: '2026-04-03T10:00:00Z',
      ends_at: '2026-04-01T10:00:00Z',
    });
    expect(r.success).toBe(false);
  });

  it('respinge durata peste maxim', () => {
    const end = new Date(new Date(base.starts_at).getTime() + (PETDAY_MAX_BOOKING_DAYS + 5) * 86400000);
    const r = PetDayBookingSchema.safeParse({
      ...base,
      ends_at: end.toISOString(),
    });
    expect(r.success).toBe(false);
  });

  it('respinge uuid invalid pentru listing', () => {
    const r = PetDayBookingSchema.safeParse({ ...base, listing_id: 'abc' });
    expect(r.success).toBe(false);
  });

  it('acceptă notă lungă de max 400', () => {
    const r = PetDayBookingSchema.safeParse({ ...base, note: 'x'.repeat(400) });
    expect(r.success).toBe(true);
  });

  it('respinge notă peste 400', () => {
    const r = PetDayBookingSchema.safeParse({ ...base, note: 'x'.repeat(401) });
    expect(r.success).toBe(false);
  });
});

describe('filterPetdayListings', () => {
  const items = [
    listing({ id: 'a', city: 'Cluj-Napoca', services: ['boarding'], provider_type: 'center', verified: true, description: 'Îngrijire atentă la mine acasă' }),
    listing({ id: 'b', city: 'București', services: ['dog_walking'], provider_type: 'sitter', description: 'Plimbări zilnice în parc' }),
    listing({ id: 'c', city: 'Brașov', services: ['boarding', 'transport'], provider_type: 'center', description: 'Hotel pentru vacanța ta' }),
  ];

  it('filtrează după serviciu', () => {
    expect(filterPetdayListings(items, { service: 'boarding' }).map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('filtrează după tip ofertant', () => {
    expect(filterPetdayListings(items, { providerType: 'center' }).map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('filtrează după oraș diacritice-insensibil, parțial', () => {
    expect(filterPetdayListings(items, { city: 'cluj' }).map((x) => x.id)).toEqual(['a']);
    expect(filterPetdayListings(items, { city: 'brașov' }).map((x) => x.id)).toEqual(['c']);
  });

  it('căutare în titlu + descriere', () => {
    const found = filterPetdayListings(items, { search: 'hotel' });
    expect(found.map((x) => x.id)).toEqual(['c']);
    const found2 = filterPetdayListings(items, { search: 'îngrijire' });
    expect(found2.map((x) => x.id)).toEqual(['a']);
  });

  it('combina filtre', () => {
    const found = filterPetdayListings(items, { service: 'boarding', providerType: 'sitter' });
    expect(found).toHaveLength(0);
  });
});

describe('sortPetdayListings', () => {
  it('verified primele, apoi descrescător după created_at', () => {
    const sorted = sortPetdayListings([
      listing({ id: 'x', verified: false, created_at: '2026-01-05T00:00:00Z' }),
      listing({ id: 'v', verified: true, created_at: '2026-01-01T00:00:00Z' }),
      listing({ id: 'y', verified: false, created_at: '2026-01-03T00:00:00Z' }),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(['v', 'x', 'y']);
  });

  it('nu mutează lista originală', () => {
    const original = [listing({ id: '1' }), listing({ id: '2', verified: true })];
    sortPetdayListings(original);
    expect(original.map((x) => x.id)).toEqual(['1', '2']);
  });
});

describe('timp rezervări', () => {
  it('bookingNights — 2 nopți', () => {
    expect(bookingNights('2026-03-01T14:00:00Z', '2026-03-03T14:00:00Z')).toBe(2);
  });

  it('bookingNights — 0 pentru daycare de o zi', () => {
    expect(bookingNights('2026-03-01T08:00:00Z', '2026-03-01T18:00:00Z')).toBe(0);
  });

  it('bookingHours — rotunjit în sus', () => {
    expect(bookingHours('2026-03-01T08:00:00Z', '2026-03-01T18:30:00Z')).toBe(11);
  });

  it('overlapsRange', () => {
    expect(overlapsRange('2026-03-01T00:00:00Z', '2026-03-05T00:00:00Z', '2026-03-04T00:00:00Z', '2026-03-08T00:00:00Z')).toBe(true);
    expect(overlapsRange('2026-03-01T00:00:00Z', '2026-03-05T00:00:00Z', '2026-03-05T00:00:00Z', '2026-03-08T00:00:00Z')).toBe(false);
  });

  it('hasConflictingBooking doar pe accepted + același listing', () => {
    const list = [
      booking({ id: 'b1', listing_id: 'l1', status: 'accepted' }),
      booking({ id: 'b2', listing_id: 'l1', status: 'pending' }),
      booking({ id: 'b3', listing_id: 'l2', status: 'accepted' }),
    ];
    expect(hasConflictingBooking(list, 'l1', '2026-03-02T00:00:00Z', '2026-03-04T00:00:00Z')).toBe(true);
    expect(hasConflictingBooking(list, 'l1', '2026-03-02T00:00:00Z', '2026-03-04T00:00:00Z', 'b1')).toBe(false);
    expect(hasConflictingBooking(list, 'l3', '2026-03-02T00:00:00Z', '2026-03-04T00:00:00Z')).toBe(false);
  });
});

describe('sortPetdayBookings + activeBookings', () => {
  const now = new Date('2026-02-25T10:00:00Z');
  const items = [
    booking({ id: 'done', status: 'completed', created_at: '2026-01-01T00:00:00Z' }),
    booking({ id: 'acc', status: 'accepted', starts_at: '2026-02-27T00:00:00Z' }),
    booking({ id: 'pend', status: 'pending', starts_at: '2026-03-10T00:00:00Z' }),
    booking({ id: 'rej', status: 'rejected', created_at: '2026-02-01T00:00:00Z' }),
  ];

  it('pending/accepted primele, apoi finalizate', () => {
    const sorted = sortPetdayBookings(items, now);
    expect(sorted.map((b) => b.id)).toEqual(['pend', 'acc', 'done', 'rej']);
  });

  it('activeBookings exclude finalizate/respinse și din trecut', () => {
    const now = new Date('2026-02-25T10:00:00Z');
    const act = activeBookings([
      booking({ id: 'a', status: 'accepted', ends_at: '2026-02-26T00:00:00Z' }),
      booking({ id: 'b', status: 'accepted', ends_at: '2026-02-20T00:00:00Z' }),
      booking({ id: 'c', status: 'completed', ends_at: '2026-03-01T00:00:00Z' }),
    ], now);
    expect(act.map((b) => b.id)).toEqual(['a']);
  });
});

describe('tranziții status', () => {
  it('pending → accepted permis', () => {
    expect(canTransitionBooking('pending', 'accepted')).toBe(true);
  });
  it('pending → completed interzis', () => {
    expect(canTransitionBooking('pending', 'completed')).toBe(false);
  });
  it('accepted → completed permis', () => {
    expect(canTransitionBooking('accepted', 'completed')).toBe(true);
  });
  it('rejected → orice interzis', () => {
    expect(canTransitionBooking('rejected', 'pending')).toBe(false);
    expect(canTransitionBooking('rejected', 'accepted')).toBe(false);
  });
});

describe('utilitare mici', () => {
  it('servicesSummary taie la max', () => {
    const s = servicesSummary(['dog_walking', 'boarding', 'transport', 'daycare'], 3);
    expect(s.shown).toHaveLength(3);
    expect(s.extra).toBe(1);
  });

  it('listingAccepts', () => {
    const l = listing({ accepts_dogs: true, accepts_cats: false, accepts_other: false });
    expect(listingAccepts(l, 'dog')).toBe(true);
    expect(listingAccepts(l, 'cat')).toBe(false);
    expect(listingAccepts(l, 'other')).toBe(false);
  });
});
