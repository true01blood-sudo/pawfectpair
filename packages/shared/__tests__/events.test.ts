/**
 * Teste PetEvents — validare Zod + utils evenimente.
 */
import {
  PetEventSchema,
  EventRsvpSchema,
  EVENTS_MAX_DURATION_DAYS,
} from '../src/validation/events';
import {
  filterEvents,
  sortEvents,
  isEventUpcoming,
  isEventOngoing,
  countGoing,
  hasSpotsLeft,
  myRsvpForEvent,
  eventDurationHours,
} from '../src/utils/events';
import type { PetEventWithRefs, EventParticipant } from '../src/types/events';

const NOW = new Date('2026-06-15T10:00:00Z');

function makeEvent(overrides: Partial<PetEventWithRefs> = {}): PetEventWithRefs {
  return {
    id: 'e1',
    organizer_id: '11111111-1111-1111-1111-111111111111',
    title: 'Zi de adopție în parc',
    description: 'Vino să cunoști animalele care caută un cămin.',
    event_type: 'adoption',
    audience: 'all',
    city: 'București',
    location: 'Parc Herastrau, intrarea principală',
    starts_at: '2026-07-01T10:00:00Z',
    ends_at: '2026-07-01T16:00:00Z',
    max_participants: 50,
    photo_url: null,
    contact_phone: null,
    status: 'published',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    participant_count: 10,
    ...overrides,
  };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Playdate puiuți',
    event_type: 'meetup',
    city: 'Cluj-Napoca',
    starts_at: '2026-07-10T09:00:00Z',
    ends_at: '2026-07-10T12:00:00Z',
    ...overrides,
  };
}

describe('PetEventSchema', () => {
  it('acceptă un eveniment valid', () => {
    const r = PetEventSchema.safeParse(validInput());
    expect(r.success).toBe(true);
  });

  it('respunde titlu prea scurt', () => {
    expect(PetEventSchema.safeParse(validInput({ title: 'ab' })).success).toBe(false);
  });

  it('respinge oraș lipsă', () => {
    const input = validInput();
    delete (input as Record<string, unknown>).city;
    expect(PetEventSchema.safeParse(input).success).toBe(false);
  });

  it('respinge tip invalid', () => {
    expect(PetEventSchema.safeParse(validInput({ event_type: 'petrecere' })).success).toBe(false);
  });

  it('respinge end <= start', () => {
    expect(
      PetEventSchema.safeParse(
        validInput({ ends_at: '2026-07-10T09:00:00Z' })
      ).success
    ).toBe(false);
  });

  it('respinge durată peste limită', () => {
    const ends = new Date(new Date('2026-07-10T09:00:00Z').getTime() +
      (EVENTS_MAX_DURATION_DAYS + 1) * 24 * 3600 * 1000).toISOString();
    expect(
      PetEventSchema.safeParse(validInput({ ends_at: ends })).success
    ).toBe(false);
  });

  it('acceptă durată exact la limită', () => {
    const ends = new Date(new Date('2026-07-10T09:00:00Z').getTime() +
      EVENTS_MAX_DURATION_DAYS * 24 * 3600 * 1000).toISOString();
    expect(PetEventSchema.safeParse(validInput({ ends_at: ends })).success).toBe(true);
  });

  it('null pe câmpuri opționale goale', () => {
    const r = PetEventSchema.safeParse(
      validInput({ description: '', location: '', contact_phone: '', photo_url: undefined })
    );
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.description).toBeNull();
      expect(r.data.location).toBeNull();
      expect(r.data.contact_phone).toBeNull();
    }
  });

  it('audience default all', () => {
    const r = PetEventSchema.safeParse(validInput());
    if (r.success) expect(r.data.audience).toBe('all');
    else fail('ar trebui să treacă');
  });

  it('respinge telefon invalid', () => {
    expect(
      PetEventSchema.safeParse(validInput({ contact_phone: 'abc123' })).success
    ).toBe(false);
  });

  it('acceptă telefon RO valid', () => {
    const r = PetEventSchema.safeParse(validInput({ contact_phone: '0722333444' }));
    expect(r.success).toBe(true);
  });

  it('respinge max_participants sub 2', () => {
    expect(PetEventSchema.safeParse(validInput({ max_participants: 1 })).success).toBe(false);
  });

  it('an anii invalidi respinși', () => {
    expect(
      PetEventSchema.safeParse(validInput({ starts_at: '1900-01-01T10:00:00Z' })).success
    ).toBe(false);
  });
});

describe('EventRsvpSchema', () => {
  it('acceptă RSVP valid', () => {
    expect(
      EventRsvpSchema.safeParse({
        event_id: '11111111-1111-1111-1111-111111111111',
        status: 'going',
      }).success
    ).toBe(true);
  });

  it('respinge status invalid', () => {
    expect(
      EventRsvpSchema.safeParse({
        event_id: '11111111-1111-1111-1111-111111111111',
        status: 'poate',
      }).success
    ).toBe(false);
  });

  it('respinge uuid invalid', () => {
    expect(
      EventRsvpSchema.safeParse({ event_id: 'abc', status: 'going' }).success
    ).toBe(false);
  });
});

describe('utils events', () => {
  it('filterEvents — tip + căutare diacritice-insensibilă', () => {
    const events = [
      makeEvent(),
      makeEvent({ id: 'e2', title: 'Campionat agility', event_type: 'competition' }),
      makeEvent({ id: 'e3', title: 'Workshop dresaj', event_type: 'training', description: 'Bazele dresajului' }),
    ];
    const r1 = filterEvents(events, { eventType: 'competition' });
    expect(r1.map((e) => e.id)).toEqual(['e2']);

    const r2 = filterEvents(events, { search: 'adopție' });
    expect(r2.map((e) => e.id)).toEqual(['e1']);

    const r3 = filterEvents(events, { search: 'AGILITY' });
    expect(r3.map((e) => e.id)).toEqual(['e2']);
  });

  it('filterEvents — oraș normalizat', () => {
    const events = [makeEvent()];
    expect(filterEvents(events, { city: 'bucuresti' })).toHaveLength(1);
    expect(filterEvents(events, { city: 'Cluj' })).toHaveLength(0);
  });

  it('isEventUpcoming / isEventOngoing', () => {
    const e = makeEvent({ starts_at: '2026-06-15T09:00:00Z', ends_at: '2026-06-15T12:00:00Z' });
    expect(isEventUpcoming(e, NOW)).toBe(false);
    expect(isEventOngoing(e, NOW)).toBe(true);

    const future = makeEvent();
    expect(isEventUpcoming(future, NOW)).toBe(true);
    expect(isEventOngoing(future, NOW)).toBe(false);
  });

  it('sortEvents — viitoare crescător, trecute la final descrescător', () => {
    const events = [
      makeEvent({ id: 'a', starts_at: '2026-07-20T10:00:00Z' }),
      makeEvent({ id: 'b', starts_at: '2026-06-20T10:00:00Z' }),
      makeEvent({ id: 'c', starts_at: '2026-07-01T10:00:00Z' }),
      makeEvent({ id: 'd', starts_at: '2026-05-01T10:00:00Z' }),
      makeEvent({ id: 'e', starts_at: '2026-06-10T10:00:00Z' }),
    ];
    const sorted = sortEvents(events, NOW);
    expect(sorted.map((e) => e.id)).toEqual(['b', 'c', 'a', 'e', 'd']);
  });

  it('countGoing', () => {
    const participants: EventParticipant[] = [
      { id: 'p1', event_id: 'e1', user_id: 'u1', status: 'going', created_at: '', updated_at: '' },
      { id: 'p2', event_id: 'e1', user_id: 'u2', status: 'going', created_at: '', updated_at: '' },
      { id: 'p3', event_id: 'e1', user_id: 'u3', status: 'maybe', created_at: '', updated_at: '' },
      { id: 'p4', event_id: 'e1', user_id: 'u4', status: 'cancelled', created_at: '', updated_at: '' },
    ];
    expect(countGoing(participants)).toBe(2);
  });

  it('hasSpotsLeft — cu și fără limită', () => {
    expect(hasSpotsLeft(makeEvent({ max_participants: 50, participant_count: 10 }))).toBe(true);
    expect(hasSpotsLeft(makeEvent({ max_participants: 10, participant_count: 10 }))).toBe(false);
    expect(hasSpotsLeft(makeEvent({ max_participants: null }))).toBe(true);
  });

  it('myRsvpForEvent — găsește RSVP activ, ignoră cancelled', () => {
    const rsvps: EventParticipant[] = [
      { id: 'p1', event_id: 'e1', user_id: 'u1', status: 'maybe', created_at: '', updated_at: '' },
      { id: 'p2', event_id: 'e2', user_id: 'u1', status: 'cancelled', created_at: '', updated_at: '' },
    ];
    expect(myRsvpForEvent(rsvps, 'e1', 'u1')).toBe('maybe');
    expect(myRsvpForEvent(rsvps, 'e2', 'u1')).toBeNull();
    expect(myRsvpForEvent(rsvps, 'e3', 'u1')).toBeNull();
  });

  it('eventDurationHours', () => {
    expect(eventDurationHours(makeEvent())).toBe(6);
  });
});
