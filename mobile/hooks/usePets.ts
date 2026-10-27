/**
 * Hook pentru animalele de companie + operații CRUD.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import type { PetInput, Pet } from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const MY_PETS_KEY = (uid: string) => ['pets', uid] as const;
export const PET_KEY = (id: string) => ['pet', id] as const;

export function useMyPets() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_PETS_KEY(uid),
    queryFn: () => queries.fetchMyPets(uid),
    enabled: !!uid,
  });
}

export function usePet(id: string | undefined) {
  return useQuery({
    queryKey: PET_KEY(id ?? ''),
    queryFn: () => queries.fetchPetById(id!),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: PetInput) => queries.createPet(uid, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_PETS_KEY(uid) }),
  });
}

export function useUpdatePet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pet> }) =>
      queries.updatePet(id, patch),
    onSuccess: (data) => {
      qc.setQueryData(PET_KEY(data.id), data);
      qc.invalidateQueries({ queryKey: MY_PETS_KEY(uid) });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (id: string) => queries.deletePet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_PETS_KEY(uid) }),
  });
}
