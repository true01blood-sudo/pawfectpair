/**
 * Utils PetDay — funcții pure pentru filtrare oferte, sortări și calcule rezervări.
 * Testate unitar în packages/shared/__tests__/petday.test.ts.
 */

import type {
  PetDayListing,
  PetDayFilters,
  PetDayBooking,
  PetDayBookingStatus,
  PetDayService,
} from '../types/petday';

/** Normalizează text pentru căutare diacritice-insensibilă (RO). */
export function normalizePetDayText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .trim();
}

/** Filtrare oferte după tip ofertant, serviciu, oraș și text (titlu + descriere). */
export function filterPetdayListings(
  listings: PetDayListing[],
  filters: PetDayFilters
): PetDayListing[] {
  const search = filters.search ? normalizePetDayText(filters.search) : null;
  const city = filters.city ? normalizePetDayText(filters.city) : null;
  return listings.filter((l) => {
    if (filters.providerType && l.provider_type !== filters.providerType) return false;
    if (filters.service && !l.services.includes(filters.service)) return false;
    if (city && !normalizePetDayText(l.city).includes(city)) return false;
    if (search) {
      const haystack = normalizePetDayText(
        `${l.title} ${l.description ?? ''} ${l.city}`
      );
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/**
 * Sortare oferte: verificați primul, apoi cele mai recente.
 * Stabil: la egalitate de verified + created_at, ordinea inițială se păstrează.
 */
export function sortPetdayListings(listings: PetDayListing[]): PetDayListing[] {
  return [...listings].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Ofertele care acceptă o anumită specie. */
export function listingAccepts(
  listing: PetDayListing,
  species: 'dog' | 'cat' | 'other'
): boolean {
  if (species === 'dog') return listing.accepts_dogs;
  if (species === 'cat') return listing.accepts_cats;
  return listing.accepts_other;
}

/**
 * Numărul de nopți acoperite de o rezervare (minim 1).
 * Ex: 14:00 → 14:00 a doua zi = 1 noapte; aceeași zi 08:00–18:00 = 0 nopți (daycare).
 */
export function bookingNights(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return 0;
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

/** Durata rezervării în ore (rotunjită în sus, minim 1). */
export function bookingHours(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
}

/** Două intervale de timp se suprapun? (folosit pentru verificarea disponibilității) */
export function overlapsRange(
  startA: string, endA: string,
  startB: string, endB: string
): boolean {
  return (
    new Date(startA).getTime() < new Date(endB).getTime() &&
    new Date(startB).getTime() < new Date(endA).getTime()
  );
}

/**
 * Verifică dacă o listare are deja o rezervare ACCEPTATĂ care se suprapune
 * cu intervalul cerut — utilizat pentru prevenirea double-booking-ului în UI.
 */
export function hasConflictingBooking(
  bookings: PetDayBooking[],
  listingId: string,
  startsAt: string,
  endsAt: string,
  ignoreBookingId?: string
): boolean {
  return bookings.some(
    (b) =>
      b.listing_id === listingId &&
      b.id !== ignoreBookingId &&
      b.status === 'accepted' &&
      overlapsRange(startsAt, endsAt, b.starts_at, b.ends_at)
  );
}

/** Ordinea logică a statusurilor pentru sortare în listele de rezervări. */
const STATUS_ORDER: Record<PetDayBookingStatus, number> = {
  pending: 0,
  accepted: 1,
  completed: 2,
  rejected: 3,
  cancelled: 4,
};

/** Sortare rezervări: active (pending/accepted) primele, apoi mai recente. */
export function sortPetdayBookings(
  bookings: PetDayBooking[],
  now: Date = new Date()
): PetDayBooking[] {
  return [...bookings].sort((a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (so !== 0) return so;
    // În interiorul aceluiași status: activele mai apropiate în viitor primele,
    // restul cronologic descrescător.
    if (a.status === 'pending' || a.status === 'accepted') {
      const distA = Math.abs(new Date(a.starts_at).getTime() - now.getTime());
      const distB = Math.abs(new Date(b.starts_at).getTime() - now.getTime());
      return distA - distB;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Rezervările în curs de desfășurare sau începând în viitorul apropiat. */
export function activeBookings(
  bookings: PetDayBooking[],
  now: Date = new Date()
): PetDayBooking[] {
  const nowMs = now.getTime();
  return bookings.filter(
    (b) =>
      (b.status === 'pending' || b.status === 'accepted') &&
      new Date(b.ends_at).getTime() >= nowMs
  );
}

/** Sumar servicii pentru card compact: primele N emoji-uri + "+X". */
export function servicesSummary(
  services: PetDayService[],
  max = 3
): { shown: PetDayService[]; extra: number } {
  return {
    shown: services.slice(0, max),
    extra: Math.max(0, services.length - max),
  };
}

/** Efectul permis al unei tranziții de status pentru o rezervare. */
export function canTransitionBooking(
  from: PetDayBookingStatus,
  to: PetDayBookingStatus
): boolean {
  const allowed: Record<PetDayBookingStatus, PetDayBookingStatus[]> = {
    pending: ['accepted', 'rejected', 'cancelled'],
    accepted: ['completed', 'cancelled'],
    rejected: [],
    completed: [],
    cancelled: [],
  };
  return allowed[from].includes(to);
}
