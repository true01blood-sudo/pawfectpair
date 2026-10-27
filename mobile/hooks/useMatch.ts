/**
 * Hook-uri pentru PetMatch și mesagerie.
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';

export const MATCH_CANDIDATES_KEY = (uid: string, filters: { species?: string; sex?: string }) =>
  ['match', 'candidates', uid, filters] as const;

export function useMatchCandidates(filters: { species?: string; sex?: string } = {}) {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MATCH_CANDIDATES_KEY(uid, filters),
    queryFn: () => queries.fetchPetMatchCandidates(uid, filters),
    enabled: !!uid,
  });
}

export function useLikePet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: ({ fromPetId, toPetId }: { fromPetId: string; toPetId: string }) =>
      queries.likePet(fromPetId, toPetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', 'candidates', uid] });
      qc.invalidateQueries({ queryKey: ['conversations', uid] });
    },
  });
}

export function usePassPet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: ({ fromPetId, toPetId }: { fromPetId: string; toPetId: string }) =>
      queries.passPet(fromPetId, toPetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['match', 'candidates', uid] }),
  });
}

// ============================================================
// CONVERSATIONS / MESSAGES
// ============================================================

export const CONVERSATIONS_KEY = (uid: string) => ['conversations', uid] as const;
export const MESSAGES_KEY = (matchId: string) => ['messages', matchId] as const;

export function useConversations() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: CONVERSATIONS_KEY(uid),
    queryFn: () => queries.fetchConversations(uid),
    enabled: !!uid,
  });
}

export function useMessages(matchId: string) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        () => qc.invalidateQueries({ queryKey: MESSAGES_KEY(matchId) })
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, qc]);

  const query = useQuery({
    queryKey: MESSAGES_KEY(matchId),
    queryFn: () => queries.fetchMessages(matchId),
    enabled: !!matchId,
  });

  return { ...query, realtimeConnected: connected };
}

export function useSendMessage(matchId: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (content: string) =>
      queries.sendMessage(matchId, user?.id ?? '', content),
    onSuccess: () => qc.invalidateQueries({ queryKey: MESSAGES_KEY(matchId) }),
  });
}
