/**
 * Store pentru preferințe UI (tema light/dark, onboarding văzut).
 * Persistă în AsyncStorage (preferințe non-sensitive).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../lib/theme';
import { themeFor, lightTheme, darkTheme, type AppTheme } from '../lib/theme';

type SystemPreference = 'light' | 'dark' | 'system';

interface UIState {
  themePreference: SystemPreference;
  onboardingCompleted: boolean;
  setThemePreference: (p: SystemPreference) => void;
  setOnboardingCompleted: (v: boolean) => void;
  /** Rezolvă tema actuală dată fiind preferința + systemAppearance */
  resolveTheme: (systemAppearance: 'light' | 'dark') => AppTheme;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      themePreference: 'system',
      onboardingCompleted: false,
      setThemePreference: (p) => set({ themePreference: p }),
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      resolveTheme: (systemAppearance) => {
        const pref = get().themePreference;
        const mode: ThemeMode =
          pref === 'system' ? systemAppearance : pref;
        return themeFor(mode);
      },
    }),
    {
      name: 'pawfectpair_ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themePreference: s.themePreference,
        onboardingCompleted: s.onboardingCompleted,
      }),
    }
  )
);

export { lightTheme, darkTheme };
