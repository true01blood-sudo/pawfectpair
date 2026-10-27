/**
 * Hook pentru profilul utilizatorului curent.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import type { ProfileInput } from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const PROFILE_KEY = (uid: string) => ['profile', uid] as const;

export function useProfile() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: PROFILE_KEY(userId),
    queryFn: () => queries.fetchProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  return useMutation({
    mutationFn: (patch: ProfileInput) => queries.updateProfile(userId, patch),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_KEY(userId), data);
    },
  });
}
