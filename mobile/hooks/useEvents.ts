/**
 * Hooks PetEvents — evenimente pet + RSVP.
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  PetEventFilters,
  PetEventInput,
  EventRsvpInput,
  EventStatus,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const EVENTS_KEY = ['events', 'list'] as const;
export const MY_EVENTS_KEY = (uid: string) => ['events', 'mine', uid] as const;
export const MY_RSVP_KEY = (uid: string) => ['events', 'rsvps', uid] as const;

/** Evenimente publicate public (filtre DB; text/șir se filtrează local în ecran). */
export function useEvents(filters: PetEventFilters) {
  return useQuery({
    queryKey: [EVENTS_KEY, filters.eventType ?? null, filters.audience ?? null, filters.city ?? null],
    queryFn: () => queries.fetchEvents(filters),
  });
}

/** Evenimentele organizate de mine (inclusiv anulate). */
export function useMyEvents() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_EVENTS_KEY(uid),
    queryFn: () => queries.fetchMyEvents(uid),
    enabled: !!uid,
  });
}

/** RSVP-urile mele (participările la evenimente). */
export function useMyRsvps() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_RSVP_KEY(uid),
    queryFn: () => queries.fetchMyRsvps(uid),
    enabled: !!uid,
  });
}

/** Reîmprospătează evenimentele/RSVP la revenirea pe ecran. */
export function useEventsRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['events'] });
    }, [qc])
  );
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: PetEventInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createEvent(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PetEventInput }) =>
      queries.updateEvent(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useSetEventStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      queries.setEventStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useSetEventRsvp() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: EventRsvpInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.setEventRsvp(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
