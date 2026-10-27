/**
 * Store Zustand pentru sesiunea de autentificare.
 * Sursa reală a sesiunii rămâne Supabase; aici ținem doar
 * un snapshot reactiv pentru UI.
 */
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (s: Session | null) => void;
  setLoading: (b: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  setSession: (s) => set({ session: s, user: s?.user ?? null }),
  setLoading: (b) => set({ loading: b }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));

/** Pornim ascultarea schimbărilor de sesiune la import */
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setLoading(false);
});
