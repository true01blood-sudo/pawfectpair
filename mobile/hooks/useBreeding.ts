/**
 * Hook PetBreeding — anunțuri de reproducere (breeding_listings).
 */
import { useQuery } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';

export const BREEDING_KEY = (species?: string) => ['breeding-listings', species ?? 'all'] as const;

export function useBreedingListings(filters: { species?: string } = {}) {
  return useQuery({
    queryKey: BREEDING_KEY(filters.species),
    queryFn: () => queries.fetchBreedingListings(filters),
  });
}
