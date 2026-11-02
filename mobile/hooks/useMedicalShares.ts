/**
 * Hooks pentru partajarea dosarului medical (acces temporar vet) și
 * pentru pedigree/genealogie — ambele pe date reale.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import type { CreateMedicalRecordShareInput, UpsertPedigreeEntryInput } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';

export const ACTIVE_SHARES_KEY = (petId: string) => ['medical-shares', petId] as const;
export const PEDIGREE_KEY = (petId: string) => ['pedigree', petId] as const;

export function useActiveShares(petId: string | undefined) {
  return useQuery({
    queryKey: ACTIVE_SHARES_KEY(petId ?? ''),
    queryFn: () => queries.fetchActiveShares(petId!),
    enabled: !!petId,
  });
}

export function useCreateMedicalRecordShare(petId: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (input: Omit<CreateMedicalRecordShareInput, 'owner_id' | 'pet_id'>) => {
      if (!user) throw new Error('Nu ești autentificat');
      return queries.createMedicalRecordShare({ ...input, owner_id: user.id, pet_id: petId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACTIVE_SHARES_KEY(petId) }),
  });
}

export function useRevokeMedicalRecordShare(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.revokeMedicalRecordShare(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACTIVE_SHARES_KEY(petId) }),
  });
}

export function usePedigreeEntries(petId: string | undefined) {
  return useQuery({
    queryKey: PEDIGREE_KEY(petId ?? ''),
    queryFn: () => queries.fetchPedigreeEntries(petId!),
    enabled: !!petId,
  });
}

export function useUpsertPedigreeEntry(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<UpsertPedigreeEntryInput, 'pet_id'>) =>
      queries.upsertPedigreeEntry({ ...input, pet_id: petId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PEDIGREE_KEY(petId) }),
  });
}
