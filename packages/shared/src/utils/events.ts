/**
 * Utils PetEvents — funcții pure pentru filtrare/sortare evenimente și RSVP.
 * Testate unitar în packages/shared/__tests__/events.test.ts.
 */
import type {
  EventParticipant,
  EventRsvpStatus,
  PetEvent,
  PetEventFilters,
  PetEventWithRefs,
} from '../types/events';

/** Normalizează text pentru căutare diacritice-insensibilă (RO). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .trim();
}

/** Filtrare evenimente după tip, public, oraș și text (titlu + descriere + locație). */
export function filterEvents(
  events: PetEventWithRefs[],
  filters: PetEventFilters
): PetEventWithRefs[] {
  const search = filters.search ? normalize(filters.search) : null;
  return events.filter((e) => {
    if (filters.eventType && e.event_type !== filters.eventType) return false;
    if (filters.audience && e.audience !== filters.audience) return false;
    if (filters.city && normalize(e.city) !== normalize(filters.city)) return false;
    if (search) {
      const haystack = normalize(`${e.title} ${e.description ?? ''} ${e.location ?? ''}`);
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Evenimentul este viitor (nedeschis încă): începe după momentul curent. */
export function isEventUpcoming(event: PetEvent, now: Date = new Date()): boolean {
  return new Date(event.starts_at).getTime() > now.getTime();
}

/** Evenimentul este în desfășurare (între start și end). */
export function isEventOngoing(event: PetEvent, now: Date = new Date()): boolean {
  const t = now.getTime();
  return (
    new Date(event.starts_at).getTime() <= t &&
    new Date(event.ends_at).getTime() >= t
  );
}

/**
 * Sortare cronologică: viitoare primele (crescător după start),
 * trecute la final (descrescător — cele mai recente primele).
 */
export function sortEvents(
  events: PetEventWithRefs[],
  now: Date = new Date()
): PetEventWithRefs[] {
  const t = now.getTime();
  const upcoming: PetEventWithRefs[] = [];
  const past: PetEventWithRefs[] = [];
  for (const e of events) {
    if (new Date(e.starts_at).getTime() >= t) upcoming.push(e);
    else past.push(e);
  }
  upcoming.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  past.sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );
  return [...upcoming, ...past];
}

/** Numărul de participanți care au confirmat (status 'going'). */
export function countGoing(participants: EventParticipant[]): number {
  return participants.filter((p) => p.status === 'going').length;
}

/** evenimentele au loc liber? (max_participants null = nelimitat) */
export function hasSpotsLeft(event: PetEventWithRefs): boolean {
  if (event.max_participants == null) return true;
  return (event.participant_count ?? 0) < event.max_participants;
}

/** RSVP-ul activ al curentului pe un eveniment (null dacă nu participă). */
export function myRsvpForEvent(
  rsvps: EventParticipant[],
  eventId: string,
  userId: string
): EventRsvpStatus | null {
  const row = rsvps.find((r) => r.event_id === eventId && r.user_id === userId);
  return row && row.status !== 'cancelled' ? row.status : null;
}

/** Durata evenimentului în ore (rotunjită). */
export function eventDurationHours(event: PetEvent): number {
  const ms =
    new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime();
  return Math.max(0, Math.round((ms / (60 * 60 * 1000)) * 10) / 10);
}
