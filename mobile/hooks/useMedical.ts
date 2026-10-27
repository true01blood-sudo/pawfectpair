/**
 * Hook pentru fișa medicală + greutate + scadențe apropiate.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import type { MedicalRecordInput, WeightLogInput } from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const MEDICAL_KEY = (petId: string) => ['medical', petId] as const;
export const WEIGHT_KEY = (petId: string) => ['weight', petId] as const;
export const UPCOMING_KEY = (uid: string) => ['medical', 'upcoming', uid] as const;

export function useMedicalRecords(petId: string) {
  return useQuery({
    queryKey: MEDICAL_KEY(petId),
    queryFn: () => queries.fetchMedicalRecords(petId),
    enabled: !!petId,
  });
}

export function useUpcomingRecords() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: UPCOMING_KEY(uid),
    queryFn: () => queries.fetchUpcomingRecords(uid),
    enabled: !!uid,
  });
}

export function useCreateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicalRecordInput) => queries.createMedicalRecord(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: MEDICAL_KEY(data.pet_id) });
      qc.invalidateQueries({ queryKey: ['medical', 'upcoming'] });
    },
  });
}

export function useDeleteMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteMedicalRecord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical'] }),
  });
}

export function useWeightLogs(petId: string) {
  return useQuery({
    queryKey: WEIGHT_KEY(petId),
    queryFn: () => queries.fetchWeightLogs(petId),
    enabled: !!petId,
  });
}

export function useAddWeightLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WeightLogInput) => queries.addWeightLog(input),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: WEIGHT_KEY(data.pet_id) }),
  });
}
