/**
 * Hook-uri de autentificare.
 * Toate acțiunile folosesc clientul Supabase și sincronizează store-ul Zustand.
 */
import { useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../store/auth.store';
import { secureStorage, STORAGE_KEYS } from '../lib/storage';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS } from '@pawfectpair/shared';
import type { z } from 'zod';
import type { LoginSchema, RegisterSchema, ResetPasswordSchema } from '@pawfectpair/shared';

/** Tipurile de input derivate din schemele Zod (schemă = value, nu type!) */
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export function useAuth() {
  const { session, user, loading, signOut } = useAuthStore();

  const isLockedOut = useCallback(async () => {
    const until = await secureStorage.getItem(STORAGE_KEYS.lockoutUntil);
    if (!until) return false;
    if (Date.now() < Number(until)) return true;
    await secureStorage.removeItem(STORAGE_KEYS.lockoutUntil);
    await secureStorage.removeItem(STORAGE_KEYS.failedAttempts);
    return false;
  }, []);

  const registerFailedAttempt = useCallback(async () => {
    const count = Number((await secureStorage.getItem(STORAGE_KEYS.failedAttempts)) ?? '0') + 1;
    await secureStorage.setItem(STORAGE_KEYS.failedAttempts, String(count));
    if (count >= MAX_LOGIN_ATTEMPTS) {
      await secureStorage.setItem(
        STORAGE_KEYS.lockoutUntil,
        String(Date.now() + LOCKOUT_DURATION_MS)
      );
      return true;
    }
    return false;
  }, []);

  const resetAttempts = useCallback(async () => {
    await secureStorage.removeItem(STORAGE_KEYS.failedAttempts);
    await secureStorage.removeItem(STORAGE_KEYS.lockoutUntil);
  }, []);

  const signInWithEmail = useCallback(
    async (input: LoginInput) => {
      if (await isLockedOut()) {
        throw new Error('Prea multe încercări. Reîncearcă în 5 minute.');
      }
      const { error } = await supabase.auth.signInWithPassword(input);
      if (error) {
        await registerFailedAttempt();
        throw error;
      }
      await resetAttempts();
    },
    [isLockedOut, registerFailedAttempt, resetAttempts]
  );

  const signUpWithEmail = useCallback(async (input: RegisterInput) => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.full_name } },
    });
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'facebook' | 'apple') => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'pawfectpair://auth/callback',
        },
      });
      if (error) throw error;
    },
    []
  );

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: 'pawfectpair://auth/reset',
    });
    if (error) throw error;
  }, []);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!session,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    resetPassword,
    signOut,
  };
}
