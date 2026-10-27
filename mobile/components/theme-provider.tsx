/**
 * Provider de temă — rezolvă light/dark pe baza preferinței utilizatorului
 * și a schemei sistemului. Conform secțiunii 5.7 (light/dark mode).
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useUIStore } from '../store/ui.store';
import type { AppTheme } from '../lib/theme';

const ThemeCtx = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemAppearance = useColorScheme() ?? 'light';
  const resolveTheme = useUIStore((s) => s.resolveTheme);
  const theme = useMemo(
    () => resolveTheme(systemAppearance as 'light' | 'dark'),
    [resolveTheme, systemAppearance]
  );
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export function useAppTheme(): AppTheme {
  const t = useContext(ThemeCtx);
  if (!t) throw new Error('useAppTheme trebuie folosit în interiorul <ThemeProvider>');
  return t;
}
