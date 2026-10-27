/**
 * Hooks PetLegacy — plan de îngrijire + memorial digital.
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  LegacyPlanInput,
  PetMemorialInput,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const LEGACY_PLANS_KEY = (uid: string) => ['legacy', 'plans', uid] as const;
export const MEMORIALS_KEY = (uid: string) => ['legacy', 'memorials', uid] as const;

/** Planurile mele de îngrijire. */
export function useLegacyPlans() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: LEGACY_PLANS_KEY(uid),
    queryFn: () => queries.fetchLegacyPlans(uid),
    enabled: !!uid,
  });
}

/** Memorialele mele. */
export function useMyMemorials() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MEMORIALS_KEY(uid),
    queryFn: () => queries.fetchMyMemorials(uid),
    enabled: !!uid,
  });
}

/** Reîmprospătează la revenirea pe ecran. */
export function useLegacyRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['legacy'] });
    }, [qc])
  );
}

export function useSaveLegacyPlan() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (vars: { input: LegacyPlanInput; existingId?: string | null }) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.upsertLegacyPlan(uid, vars.input, vars.existingId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy'] }),
  });
}

export function useDeleteLegacyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteLegacyPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy'] }),
  });
}

export function useCreateMemorial() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: PetMemorialInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createMemorial(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy'] }),
  });
}

export function useUpdateMemorial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PetMemorialInput }) =>
      queries.updateMemorial(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy'] }),
  });
}

export function useDeleteMemorial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteMemorial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy'] }),
  });
}
