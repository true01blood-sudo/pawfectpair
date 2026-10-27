/**
 * Hook PetPlanner — activități planificate per animal.
 *
 * Funcționalități:
 * - listă activități (toate animalele sau per animal), sortate: activate
 *   crescător după termen, finalizate la final;
 * - creare cu validare Zod (PlannerTaskSchema) înainte de insert;
 * - toggle done cu RECURENȚĂ AUTOMATĂ: completarea unei activități
 *   recurente (daily/weekly) generează instant următoarea apariție,
 *   păstrând ora din zi (nextOccurrenceISO din @pawfectpair/shared);
 * - ștergere cu invalidare cache.
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';
import {
  nextOccurrenceISO,
  sortPlannerTasks,
  countOpenToday,
  type PlannerTaskInput,
  type PlannerTask,
} from '@pawfectpair/shared';

export const PLANNER_KEY = (petId?: string) => ['planner-tasks', petId ?? 'all'] as const;

/** Activități pentru un animal (sau toate, dacă petId lipsește). */
export function usePlannerTasks(petId?: string, includeDone = true) {
  return useQuery({
    queryKey: [...PLANNER_KEY(petId), includeDone],
    queryFn: () => queries.fetchPlannerTasks(petId, includeDone),
  });
}

export function useCreatePlannerTask(petId?: string) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: (input: PlannerTaskInput) => {
      if (!userId) throw new Error('Trebuie să fii autentificat');
      return queries.createPlannerTask(userId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner-tasks'] });
    },
  });
}

/**
 * Toggle done. La FINALIZAREA unei activități recurente se creează
 * automat următoarea apariție (daily → mâine la aceeași oră,
 * weekly → săptămâna viitoare), astfel programul nu se întrerupe niciodată.
 */
export function useTogglePlannerTask() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);

  return useMutation({
    mutationFn: async ({ task, done }: { task: PlannerTask; done: boolean }) => {
      await queries.setPlannerTaskDone(task.id, done);
      // recurență: doar la trecerea pe „finalizată" (nu și la undo)
      if (done && task.recurrence !== 'none' && userId) {
        const nextDue = nextOccurrenceISO(task.due_at, task.recurrence);
        if (nextDue) {
          const next: PlannerTaskInput = {
            pet_id: task.pet_id,
            title: task.title,
            category: task.category,
            due_at: nextDue,
            recurrence: task.recurrence,
          };
          try {
            await queries.createPlannerTask(userId, next);
          } catch {
            // nu blocăm toggle-ul dacă recurența eșuează (ex: validare);
            // activitatea curentă rămâne marcată done
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner-tasks'] });
    },
  });
}

export function useDeletePlannerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deletePlannerTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner-tasks'] });
    },
  });
}

/**
 * Wrapper pentru ecran: returnează lista SORTATĂ (activate crescător,
 * finalizate la final) + contorul „de făcut azi" pentru badge.
 */
export function usePlannerList(petId?: string) {
  const { data: tasks, isLoading, error, refetch } = usePlannerTasks(petId);
  const sorted = useMemo(() => sortPlannerTasks(tasks ?? []), [tasks]);
  const openToday = useMemo(() => countOpenToday(tasks ?? []), [tasks]);
  return { tasks: sorted, isLoading, error, refetch, openToday };
}
