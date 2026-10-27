/**
 * Hooks PetDay — oferte pet-sitting / pet-hotel + rezervări.
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  PetDayFilters,
  PetDayListingInput,
  PetDayBookingInput,
  PetDayBookingStatus,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const PETDAY_LISTINGS_KEY = ['petday', 'listings'] as const;
export const MY_PETDAY_LISTINGS_KEY = (uid: string) => ['petday', 'my-listings', uid] as const;
export const PETDAY_BOOKINGS_OWNER_KEY = (uid: string) => ['petday', 'bookings-owner', uid] as const;
export const PETDAY_BOOKINGS_PROVIDER_KEY = (uid: string) => ['petday', 'bookings-provider', uid] as const;

/** Oferte publice active (cu filtre DB; căutare text se face local în ecran). */
export function usePetdayListings(filters: PetDayFilters) {
  return useQuery({
    queryKey: [PETDAY_LISTINGS_KEY, filters.providerType ?? null, filters.service ?? null, filters.city ?? null],
    queryFn: () => queries.fetchPetdayListings(filters),
  });
}

/** Ofertele mele (ca ofertant). */
export function useMyPetdayListings() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_PETDAY_LISTINGS_KEY(uid),
    queryFn: () => queries.fetchMyPetdayListings(uid),
    enabled: !!uid,
  });
}

/** Rezervările mele ca stăpân. */
export function usePetdayBookingsAsOwner() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: PETDAY_BOOKINGS_OWNER_KEY(uid),
    queryFn: () => queries.fetchPetdayBookingsAsOwner(uid),
    enabled: !!uid,
  });
}

/** Rezervările primite pe ofertele mele (ca ofertant). */
export function usePetdayBookingsForMyListings() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: PETDAY_BOOKINGS_PROVIDER_KEY(uid),
    queryFn: () => queries.fetchPetdayBookingsForMyListings(uid),
    enabled: !!uid,
  });
}

/** Reîmprospătează rezervările/ofertele la revenirea pe ecran (fără realtime dependență). */
export function usePetdayRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['petday'] });
    }, [qc])
  );
}

export function useCreatePetdayListing() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: PetDayListingInput) => queries.createPetdayListing(uid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['petday'] });
    },
  });
}

export function useUpdatePetdayListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PetDayListingInput }) =>
      queries.updatePetdayListing(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['petday'] }),
  });
}

export function useSetPetdayListingActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      queries.setPetdayListingActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['petday'] }),
  });
}

export function useDeletePetdayListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deletePetdayListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['petday'] }),
  });
}

export function useCreatePetdayBooking() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: PetDayBookingInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createPetdayBooking(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['petday'] }),
  });
}

export function useSetPetdayBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PetDayBookingStatus }) =>
      queries.setPetdayBookingStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['petday'] }),
  });
}
