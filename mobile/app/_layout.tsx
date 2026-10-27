/**
 * Root layout — provider-ele globale: i18n, Supabase (importat), QueryClient,
 * ThemeProvider, StatusBar. Redirecționarea auth se face în (auth)/_layout
 * și (tabs)/_layout.
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_CACHE_CONFIG } from '@pawfectpair/shared';
import { ThemeProvider } from '../components/theme-provider';
import { setupNotifications } from '../lib/push';
// Inițializează i18n (important: importat pentru efect lateral)
import '../lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...QUERY_CACHE_CONFIG,
      networkMode: 'offlineFirst',
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="animale" />
              <Stack.Screen name="modul" />
              <Stack.Screen name="setari" />
            </Stack>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
