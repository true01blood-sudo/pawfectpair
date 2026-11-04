/**
 * Root layout — provider-ele globale: i18n, Supabase (importat), QueryClient,
 * ThemeProvider, StatusBar. Redirecționarea auth se face în (auth)/_layout
 * și (tabs)/_layout.
 */
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_CACHE_CONFIG } from '@pawfectpair/shared';
import { ThemeProvider } from '../components/theme-provider';
import { UpdateRequiredScreen } from '../components/UpdateRequiredScreen';
import { setupNotifications, registerForPushNotifications } from '../lib/push';
import { checkUpdateRequired, type UpdateGateResult } from '../lib/update-gate';
import { supabase } from '../lib/supabase/client';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
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
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [updateGate, setUpdateGate] = useState<UpdateGateResult | null>(null);

  useEffect(() => {
    checkUpdateRequired().then(setUpdateGate);
  }, []);

  useEffect(() => {
    setupNotifications();

    // Înregistrează token push la fiecare login (email, OAuth, restore sesiune)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          registerForPushNotifications(session.user.id).catch(console.error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            {updateGate?.required ? (
              <UpdateRequiredScreen message={updateGate.message} storeUrl={updateGate.storeUrl} />
            ) : (
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="animale" />
                <Stack.Screen name="modul" />
                <Stack.Screen name="setari" />
              </Stack>
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
