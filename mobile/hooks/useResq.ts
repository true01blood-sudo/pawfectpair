/**
 * Hooks PetResQ — cazuri pierdut/găsit + sfaturi comunitare.
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  ResqCaseInput,
  ResqFilters,
  ResqStatus,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const RESQ_CASES_KEY = ['resq', 'cases'] as const;
export const RESQ_MINE_KEY = (uid: string) => ['resq', 'mine', uid] as const;

/** Toate cazurile (publice; filtre DB, textul se filtrează local). */
export function useResqCases(filters: ResqFilters) {
  return useQuery({
    queryKey: [RESQ_CASES_KEY, filters.type ?? null, filters.status ?? null, filters.city ?? null],
    queryFn: () => queries.fetchResqCases(filters),
  });
}

/** Cazurile raportate de mine. */
export function useMyResqCases() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: RESQ_MINE_KEY(uid),
    queryFn: () => queries.fetchMyResqCases(uid),
    enabled: !!uid,
  });
}

/** Sfaturile unui caz (fetch la cerere). */
export function useResqTips(caseId: string | null) {
  return useQuery({
    queryKey: ['resq', 'tips', caseId],
    queryFn: () => queries.fetchResqTips(caseId as string),
    enabled: !!caseId,
  });
}

/** Reîmprospătează cazurile la revenirea pe ecran. */
export function useResqRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['resq'] });
    }, [qc])
  );
}

export function useCreateResqCase() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: ResqCaseInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createResqCase(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resq'] }),
  });
}

export function useUpdateResqCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ResqCaseInput }) =>
      queries.updateResqCase(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resq'] }),
  });
}

export function useSetResqCaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResqStatus }) =>
      queries.setResqCaseStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resq'] }),
  });
}

export function useDeleteResqCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteResqCase(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resq'] }),
  });
}

export function useCreateResqTip() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: { case_id: string; message: string }) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createResqTip(uid, input);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['resq'] });
      qc.invalidateQueries({ queryKey: ['resq', 'tips', vars.case_id] });
    },
  });
}

export function useDeleteResqTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteResqTip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resq'] }),
  });
}
