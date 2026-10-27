/**
 * Hook Adopții — anunțuri de adoptare + aplicații.
 *
 * Explorează: listă publică cu filtre (specie/oraș/status).
 * Anunțurile mele: CRUD + aplicațiile primite (accept/reject).
 * Candidat: aplică la anunț + vezi statusul aplicațiilor proprii.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';
import type { AdoptionFilters, AdoptionStatus, ApplicationStatus } from '@pawfectpair/shared';

export const ADOPTIONS_KEY = (filters: AdoptionFilters) => ['adoption-listings', filters] as const;
export const MY_LISTINGS_KEY = ['adoption-my-listings'] as const;
export const MY_APPLICATIONS_KEY = ['adoption-my-applications'] as const;
export const LISTING_APPS_KEY = (listingId: string) => ['adoption-apps', listingId] as const;

// ================= EXPLORE =================

export function useAdoptionListings(filters: AdoptionFilters) {
  return useQuery({
    queryKey: ADOPTIONS_KEY(filters),
    queryFn: () => queries.fetchAdoptionListings(filters),
  });
}

// ================= ANUNȚURILE MELE =================

export function useMyAdoptionListings() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: MY_LISTINGS_KEY,
    queryFn: () => queries.fetchMyAdoptionListings(userId!),
    enabled: !!userId,
  });
}

export function useCreateAdoptionListing() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: (input: Parameters<typeof queries.createAdoptionListing>[1]) => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.createAdoptionListing(userId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-listings'] });
      qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
}

export function useUpdateAdoptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdoptionStatus }) =>
      queries.updateAdoptionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-listings'] });
      qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
}

export function useDeleteAdoptionListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteAdoptionListing(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-listings'] });
      qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
}

// ================= APLICAȚII =================

export function useListingApplications(listingId: string | null) {
  return useQuery({
    queryKey: LISTING_APPS_KEY(listingId ?? ''),
    queryFn: () => queries.fetchListingApplications(listingId!),
    enabled: !!listingId,
  });
}

export function useMyApplications() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: MY_APPLICATIONS_KEY,
    queryFn: () => queries.fetchMyApplications(userId!),
    enabled: !!userId,
  });
}

export function useApplyToAdoption() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: ({ listingId, message }: { listingId: string; message?: string }) => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.applyToAdoption(userId, listingId, message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-apps'] });
      qc.invalidateQueries({ queryKey: MY_APPLICATIONS_KEY });
    },
  });
}

export function useSetApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      queries.setApplicationStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-apps'] });
      qc.invalidateQueries({ queryKey: MY_APPLICATIONS_KEY });
      qc.invalidateQueries({ queryKey: ['adoption-listings'] });
      qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
}

/** Stare de filtare convenience pentru ecran. */
export function useAdoptionFilterState(initial: AdoptionFilters = { status: 'available' }) {
  const [filters, setFilters] = useState<AdoptionFilters>(initial);
  const setSpecies = (species?: AdoptionFilters['species']) =>
    setFilters((f) => ({ ...f, species }));
  const setCity = (city?: string) => setFilters((f) => ({ ...f, city: city || undefined }));
  const reset = () => setFilters(initial);
  return { filters, setSpecies, setCity, reset };
}
