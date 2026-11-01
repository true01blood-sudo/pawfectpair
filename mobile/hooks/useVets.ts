/**
 * Hook Explore — cabinete veterinare (vets), pentru categoria "Care".
 */
import { useQuery } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';

export const VETS_KEY = (city?: string) => ['vets', city ?? 'all'] as const;

export function useVets(filters: { city?: string } = {}) {
  return useQuery({
    queryKey: VETS_KEY(filters.city),
    queryFn: () => queries.fetchVets(filters),
  });
}
