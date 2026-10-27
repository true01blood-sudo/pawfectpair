/**
 * Tipuri pentru modulul PetDay — servicii de însoțire/îngrijire (pet-sitting),
 * plimbare și cazare specializată (pet-hotel) oferite de persoane fizice
 * și de centre specializate.
 */

import type { Profile } from './profile';
import type { Pet } from './pet';

/** Tip de ofertant: persoană fizică (pet-sitter) sau centru specializat (hotel/curte) */
export type PetDayProviderType = 'sitter' | 'center';

/** Servicii oferite în cadrul unei listări PetDay */
export type PetDayService =
  | 'dog_walking'        // plimbări regulate
  | 'home_visits'        // vizite la domiciliul stăpânului (hrănire, curățenie, companie)
  | 'sitting_at_owner'   // pet-sitter sta la stăpân (casa proprietarului)
  | 'sitting_at_sitter'  // animalul sta la pet-sitter (locuința sitterului)
  | 'daycare'            // îngrijire pe timpul zilei (fără cazare)
  | 'boarding'           // cazare pe durata nopții (pet-hotel)
  | 'transport';         // transport (veterinar, aeroport etc.)

export const PETDAY_PROVIDER_TYPES = ['sitter', 'center'] as const;

export const PETDAY_SERVICES = [
  'dog_walking',
  'home_visits',
  'sitting_at_owner',
  'sitting_at_sitter',
  'daycare',
  'boarding',
  'transport',
] as const;

export const PETDAY_SERVICE_EMOJI: Record<PetDayService, string> = {
  dog_walking: '🚶',
  home_visits: '🏠',
  sitting_at_owner: '🛋️',
  sitting_at_sitter: '🏡',
  daycare: '☀️',
  boarding: '🛏️',
  transport: '🚗',
};

export const PETDAY_PROVIDER_EMOJI: Record<PetDayProviderType, string> = {
  sitter: '🧑‍🍼',
  center: '🏨',
};

/** Unitate de preț pentru ofertă */
export type PetDayPriceUnit = 'day' | 'night' | 'hour' | 'visit' | 'walk';

export const PETDAY_PRICE_UNITS = ['day', 'night', 'hour', 'visit', 'walk'] as const;

/** Statusuri rezervare PetDay */
export type PetDayBookingStatus =
  | 'pending'    // cerere trimisă de stăpân
  | 'accepted'   // acceptată de ofertant
  | 'rejected'   // respinsă de ofertant
  | 'completed'  // serviciu efectuat
  | 'cancelled'; // anulat de oricare parte

export const PETDAY_BOOKING_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'completed',
  'cancelled',
] as const;

export interface PetDayListing {
  id: string;
  user_id: string;
  provider_type: PetDayProviderType;
  title: string;
  description: string | null;
  services: PetDayService[];
  city: string;
  address: string | null;          // pentru centre / hoteluri
  price_from: number | null;       // RON
  price_unit: PetDayPriceUnit;
  max_pets: number | null;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepts_other: boolean;
  photo_url: string | null;
  phone: string | null;
  verified: boolean;               // confirmat de administrator (viitor panou admin)
  active: boolean;                 // vizibil public
  created_at: string;
  updated_at: string;
}

export interface PetDayListingWithOwner extends PetDayListing {
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface PetDayBooking {
  id: string;
  listing_id: string;
  owner_id: string;                // stăpânul care cere serviciul
  pet_id: string | null;
  starts_at: string;               // ISO datetime
  ends_at: string;                 // ISO datetime
  note: string | null;
  status: PetDayBookingStatus;
  created_at: string;
  updated_at: string;
}

export interface PetDayBookingWithRefs extends PetDayBooking {
  pet?: Pick<Pet, 'id' | 'name' | 'photo_url'> | null;
  listing?: Pick<PetDayListing, 'id' | 'title' | 'city' | 'provider_type' | 'user_id'> | null;
}

export interface PetDayFilters {
  service?: PetDayService | null;
  providerType?: PetDayProviderType | null;
  city?: string | null;
  search?: string;
}

/** Input pentru crearea/editarea unei oferte */
export interface PetDayListingInput {
  title: string;
  provider_type: PetDayProviderType;
  services: PetDayService[];
  city: string;
  description?: string | null;
  address?: string | null;
  price_from?: number | null;
  price_unit?: PetDayPriceUnit;
  max_pets?: number | null;
  accepts_dogs?: boolean;
  accepts_cats?: boolean;
  accepts_other?: boolean;
  photo_url?: string | null;
  phone?: string | null;
}

/** Input pentru o cerere de rezervare */
export interface PetDayBookingInput {
  listing_id: string;
  pet_id?: string | null;
  starts_at: string;
  ends_at: string;
  note?: string | null;
}
