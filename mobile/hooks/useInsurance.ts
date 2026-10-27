/**
 * Hooks PetInsurance — polițe + despăgubiri.
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  ClaimStatus,
  InsuranceClaimInput,
  InsuranceFilters,
  InsurancePolicyInput,
  PolicyStatus,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const INSURANCE_POLICIES_KEY = (uid: string) => ['insurance', 'policies', uid] as const;
export const INSURANCE_CLAIMS_KEY = (uid: string) => ['insurance', 'claims', uid] as const;

/** Polițele mele (filtre DB). */
export function useInsurancePolicies(filters: InsuranceFilters = {}) {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: [INSURANCE_POLICIES_KEY(uid), filters.petId ?? null, filters.policyType ?? null],
    queryFn: () => queries.fetchInsurancePolicies(uid, filters),
    enabled: !!uid,
  });
}

/** Despăgubirile mele (opțional pe poliță). */
export function useInsuranceClaims(policyId?: string | null) {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: [INSURANCE_CLAIMS_KEY(uid), policyId ?? null],
    queryFn: () => queries.fetchInsuranceClaims(uid, policyId),
    enabled: !!uid,
  });
}

/** Reîmprospătează la revenirea pe ecran. */
export function useInsuranceRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['insurance'] });
    }, [qc])
  );
}

export function useCreateInsurancePolicy() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: InsurancePolicyInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createInsurancePolicy(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

export function useUpdateInsurancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InsurancePolicyInput }) =>
      queries.updateInsurancePolicy(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

export function useSetInsurancePolicyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PolicyStatus }) =>
      queries.setInsurancePolicyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

export function useDeleteInsurancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteInsurancePolicy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

export function useCreateInsuranceClaim() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: InsuranceClaimInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createInsuranceClaim(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

export function useSetInsuranceClaimStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClaimStatus }) =>
      queries.setInsuranceClaimStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}
