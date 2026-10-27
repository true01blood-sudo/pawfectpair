/**
 * Client Supabase pentru React Native (Expo).
 * Conform secțiunii 7 și 8.2 din specificație.
 *
 * Variabile de mediu (mobile/.env):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * NU include SERVICE_ROLE_KEY niciodată în codul client.
 */
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { secureStorage } from '../storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Lipsesc EXPO_PUBLIC_SUPABASE_URL sau EXPO_PUBLIC_SUPABASE_ANON_KEY.\n' +
      'Copiază mobile/.env.example în mobile/.env și completează valorile.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // false pe mobil
    storageKey: 'pawfectpair_auth',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    headers: { 'x-client-info': 'pawfectpair-mobile' },
  },
});

export { supabaseUrl };
