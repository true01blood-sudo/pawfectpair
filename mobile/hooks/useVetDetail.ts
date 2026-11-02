/**
 * Hooks pentru ecranul de detaliu + programare veterinar, și detaliu trainer.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import type { BookVetAppointmentInput } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';

export const VET_DETAIL_KEY = (id: string) => ['vet', id] as const;
export const VET_SERVICES_KEY = (id: string) => ['vet', id, 'services'] as const;
export const VET_REVIEWS_KEY = (id: string) => ['vet', id, 'reviews'] as const;
export const TRAINER_DETAIL_KEY = (id: string) => ['trainer', id] as const;

export function useVetDetail(id: string | undefined) {
  return useQuery({
    queryKey: VET_DETAIL_KEY(id ?? ''),
    queryFn: () => queries.fetchVetDetail(id!),
    enabled: !!id,
  });
}

export function useVetServicesFull(vetId: string | undefined) {
  return useQuery({
    queryKey: VET_SERVICES_KEY(vetId ?? ''),
    queryFn: () => queries.fetchVetServicesFull(vetId!),
    enabled: !!vetId,
  });
}

export function useVetReviewsFull(vetId: string | undefined) {
  return useQuery({
    queryKey: VET_REVIEWS_KEY(vetId ?? ''),
    queryFn: () => queries.fetchVetReviewsFull(vetId!),
    enabled: !!vetId,
  });
}

export function useSubmitVetReview(vetId: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string | null }) => {
      if (!user) throw new Error('Nu ești autentificat');
      return queries.submitVetReview(vetId, user.id, rating, comment);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VET_REVIEWS_KEY(vetId) }),
  });
}

export function useBookVetAppointment() {
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (input: Omit<BookVetAppointmentInput, 'owner_id'>) => {
      if (!user) throw new Error('Nu ești autentificat');
      return queries.bookVetAppointment({ ...input, owner_id: user.id });
    },
  });
}

export function useTrainerDetail(id: string | undefined) {
  return useQuery({
    queryKey: TRAINER_DETAIL_KEY(id ?? ''),
    queryFn: () => queries.fetchTrainerDetail(id!),
    enabled: !!id,
  });
}
