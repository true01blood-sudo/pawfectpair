/**
 * Hooks PetConnect — forum (postări + comentarii).
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type { ForumPostInput, ForumCommentInput } from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const POSTS_KEY = ['connect', 'posts'] as const;
export const MY_POSTS_KEY = (uid: string) => ['connect', 'my-posts', uid] as const;

/** Toate postările (feed public). */
export function useForumPosts() {
  return useQuery({
    queryKey: POSTS_KEY,
    queryFn: () => queries.fetchForumPosts(),
  });
}

/** Postările mele. */
export function useMyForumPosts() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_POSTS_KEY(uid),
    queryFn: () => queries.fetchMyForumPosts(uid),
    enabled: !!uid,
  });
}

/** Comentariile unei postări (fetch la cerere, la deschiderea detaliului). */
export function usePostComments(postId: string | null) {
  return useQuery({
    queryKey: ['connect', 'comments', postId],
    queryFn: () => queries.fetchPostComments(postId as string),
    enabled: !!postId,
  });
}

/** Reîmprospătează postările la revenirea pe ecran. */
export function useConnectRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['connect'] });
    }, [qc])
  );
}

export function useCreateForumPost() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: ForumPostInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createForumPost(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connect'] }),
  });
}

export function useDeleteForumPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteForumPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connect'] }),
  });
}

export function useCreateForumComment() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: ForumCommentInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createForumComment(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connect'] }),
  });
}

export function useDeleteForumComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteForumComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connect'] }),
  });
}
