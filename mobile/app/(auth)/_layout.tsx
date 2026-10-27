/**
 * Layout grupa (auth) — redirecționează spre (tabs) dacă sesiunea există.
 */
import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return null;
  if (session) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
