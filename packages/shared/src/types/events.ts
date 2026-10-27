/**
 * Tipuri pentru modulul PetEvents — evenimente pentru animale de companie:
 * întâlniri, zile de adopție, competiții, workshop-uri, expoziții, acțiuni caritabile.
 * Organizatorii publică evenimente; membrii confirmă participarea (RSVP).
 */

import type { Profile } from './profile';

/** Tip de eveniment */
export type EventType =
  | 'meetup'      // întâlniri de comunitate / playdate
  | 'adoption'    // zi de adopție
  | 'competition' // competiții / concursuri (agility, beauty contest)
  | 'training'    // workshop / curs de dresaj
  | 'expo'        // expoziții / târguri pet
  | 'charity'     // acțiuni caritabile / donații
  | 'other';      // alte evenimente

export const EVENT_TYPES = [
  'meetup',
  'adoption',
  'competition',
  'training',
  'expo',
  'charity',
  'other',
] as const;

export const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  meetup: '🐾',
  adoption: '🏠',
  competition: '🏆',
  training: '🎓',
  expo: '🎪',
  charity: '💚',
  other: '📅',
};

/** Publicul țintă al evenimentului */
export type EventAudience = 'all' | 'dogs' | 'cats' | 'small_pets';

export const EVENT_AUDIENCES = ['all', 'dogs', 'cats', 'small_pets'] as const;

export const EVENT_AUDIENCE_EMOJI: Record<EventAudience, string> = {
  all: '🐾',
  dogs: '🐕',
  cats: '🐈',
  small_pets: '🐹',
};

/** Status eveniment */
export type EventStatus = 'published' | 'cancelled';

export const EVENT_STATUSES = ['published', 'cancelled'] as const;

/** Status RSVP participant */
export type EventRsvpStatus = 'going' | 'maybe' | 'cancelled';

export const EVENT_RSVP_STATUSES = ['going', 'maybe', 'cancelled'] as const;

/** Eveniment complet */
export interface PetEvent {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  audience: EventAudience;
  city: string;
  location: string | null;      // locație textuală (parc, sală, adresă)
  starts_at: string;            // ISO datetime
  ends_at: string;              // ISO datetime
  max_participants: number | null;
  photo_url: string | null;
  contact_phone: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

/** Eveniment cu organizator + număr participanți (pentru listare) */
export interface PetEventWithRefs extends PetEvent {
  organizer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  participant_count?: number;
  /** RSVP-ul curentului pe acest eveniment (umplut local în ecran) */
  my_rsvp?: EventRsvpStatus | null;
}

/** Participant la un eveniment */
export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: EventRsvpStatus;
  created_at: string;
  updated_at: string;
}

/** Participant cu profil (pentru lista organizatorului) */
export interface EventParticipantWithProfile extends EventParticipant {
  profile?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

/** Filtre listare evenimente */
export interface PetEventFilters {
  eventType?: EventType | null;
  audience?: EventAudience | null;
  city?: string | null;
  search?: string;
}

/** Input creare/editare eveniment */
export interface PetEventInput {
  title: string;
  event_type: EventType;
  audience?: EventAudience;
  city: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at: string;
  max_participants?: number | null;
  photo_url?: string | null;
  contact_phone?: string | null;
}

/** Input RSVP */
export interface EventRsvpInput {
  event_id: string;
  status: EventRsvpStatus;
}
