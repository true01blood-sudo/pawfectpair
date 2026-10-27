/**
 * Hooks PetTraining — abilități + sesiuni de antrenament.
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  TrainingFilters,
  TrainingSkillInput,
  TrainingSkillStatus,
  TrainingSessionInput,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const TRAINING_SKILLS_KEY = (uid: string) => ['training', 'skills', uid] as const;
export const TRAINING_SESSIONS_KEY = (uid: string) => ['training', 'sessions', uid] as const;

/** Abilitățile mele (filtre DB; mastered exclus la cerere). */
export function useTrainingSkills(filters: TrainingFilters, includeMastered = true) {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: [TRAINING_SKILLS_KEY(uid), filters.petId ?? null, filters.category ?? null, includeMastered],
    queryFn: () => queries.fetchTrainingSkills(uid, { ...filters, includeMastered }),
    enabled: !!uid,
  });
}

/** Sesiunile mele (opțional pe skill / animal). */
export function useTrainingSessions(opts: { skillId?: string | null; petId?: string | null } = {}) {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: [TRAINING_SESSIONS_KEY(uid), opts.skillId ?? null, opts.petId ?? null],
    queryFn: () => queries.fetchTrainingSessions(uid, opts),
    enabled: !!uid,
  });
}

/** Reîmprospătează la revenirea pe ecran. */
export function useTrainingRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['training'] });
    }, [qc])
  );
}

export function useCreateTrainingSkill() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: TrainingSkillInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createTrainingSkill(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useUpdateTrainingSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TrainingSkillInput }) =>
      queries.updateTrainingSkill(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useSetTrainingSkillStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrainingSkillStatus }) =>
      queries.setTrainingSkillStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useDeleteTrainingSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteTrainingSkill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useCreateTrainingSession() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (vars: { input: TrainingSessionInput; petId?: string | null }) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createTrainingSession(uid, vars.input, vars.petId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useDeleteTrainingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteTrainingSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}
