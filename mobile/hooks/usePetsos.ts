/**
 * Hook PetSOS — evenimente urgență + contact de urgență.
 *
 * - useSosEvents: istoric evenimente ale owner-ului (RLS)
 * - useCreateSosEvent: înregistrează urgența (medical/lost/danger)
 * - useSaveEmergencyContact: salvează contactul rapid pe animal
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';
import type { SosEventType } from '@pawfectpair/shared';

export const SOS_EVENTS_KEY = ['sos-events'] as const;

export function useSosEvents(limit = 20) {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: [...SOS_EVENTS_KEY, limit],
    queryFn: () => queries.fetchSosEvents(userId!, limit),
    enabled: !!userId,
  });
}

export function useCreateSosEvent() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: (input: { pet_id: string; type: SosEventType; notes?: string | null }) => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.createSosEvent(userId, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SOS_EVENTS_KEY }),
  });
}

export function useSaveEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      petId,
      name,
      phone,
    }: {
      petId: string;
      name: string | null;
      phone: string | null;
    }) =>
      queries.setPetEmergencyContact(petId, {
        emergency_contact_name: name,
        emergency_contact_phone: phone,
      }),
    onSuccess: () => {
      // invalidează pets + toate cheile derivate
      qc.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}
