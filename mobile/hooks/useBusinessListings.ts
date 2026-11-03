/**
 * Hook pentru directorul de activitati conexe (harta) — magazine pentru
 * animale, adaposturi/centre de adoptie, traineri listati extern
 * (OSM + ACh.ro, vezi scripts/business-import/).
 */
import { useQuery } from '@tanstack/react-query';
import { queries } from '../lib/supabase/queries';

export const BUSINESS_LISTINGS_KEY = ['business-listings'] as const;

export function useBusinessListings() {
  return useQuery({
    queryKey: BUSINESS_LISTINGS_KEY,
    queryFn: () => queries.fetchBusinessListings(),
  });
}
