/**
 * Hook PetEdu — articole educaționale + director traineri.
 *
 * - useEduArticles: listă articole cu filte (specie/categorie/căutare)
 * - useTrainers: director public traineri (specializare/oraș/căutare)
 * - useMyTrainerProfile: profilul trainer al userului curent
 * - useSaveTrainerProfile: upsert profil (unul per user)
 * - useToggleTrainerActive: activează/dezactivează vizibilitatea publică
 * - useEduLibrary: articole sortate + categorii unice (memorat)
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';
import {
  eduArticleCategories,
  sortEduArticles,
  type EduFilters,
  type TrainerInput,
  type TrainerFilters,
} from '@pawfectpair/shared';

const ARTICLES_KEY = ['edu-articles'] as const;
const TRAINERS_KEY = ['edu-trainers'] as const;
const MY_TRAINER_KEY = ['edu-trainers-me'] as const;

export function useEduArticles(filters: EduFilters = {}) {
  return useQuery({
    queryKey: [...ARTICLES_KEY, filters],
    queryFn: () => queries.fetchEduArticles(filters),
  });
}

export function useTrainers(filters: TrainerFilters = {}) {
  return useQuery({
    queryKey: [...TRAINERS_KEY, filters],
    queryFn: () => queries.fetchTrainers(filters),
  });
}

export function useMyTrainerProfile() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: [...MY_TRAINER_KEY, userId],
    queryFn: () => queries.fetchMyTrainerProfile(userId!),
    enabled: !!userId,
  });
}

export function useSaveTrainerProfile() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: (input: TrainerInput) => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.upsertTrainerProfile(userId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_TRAINER_KEY });
      qc.invalidateQueries({ queryKey: TRAINERS_KEY });
    },
  });
}

export function useToggleTrainerActive() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: ({ active }: { active: boolean }) => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.setTrainerActive(userId, active);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_TRAINER_KEY });
      qc.invalidateQueries({ queryKey: TRAINERS_KEY });
    },
  });
}

export function useDeleteTrainerProfile() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.deleteTrainerProfile(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_TRAINER_KEY });
      qc.invalidateQueries({ queryKey: TRAINERS_KEY });
    },
  });
}

/** Biblioteca memorată: articole sortate + categorii unice pentru filtre. */
export function useEduLibrary(articles: ReturnType<typeof useEduArticles>['data']) {
  return useMemo(() => {
    const sorted = sortEduArticles(articles ?? []);
    const categories = eduArticleCategories(articles ?? []);
    return { sorted, categories };
  }, [articles]);
}
