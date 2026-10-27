/**
 * Layout grupa (tabs) — 5 tab-uri: Home, PetMatch, Module, Comunitate, Profil.
 * Redirecționează spre (auth)/login dacă sesiunea lipsește.
 */
import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { useAppTheme } from '../../components/theme-provider';

export default function TabsLayout() {
  const t = useAppTheme();
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acasă',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="petmatch"
        options={{
          title: 'PetMatch',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="module"
        options={{
          title: 'Module',
          tabBarIcon: ({ color, size }) => <Ionicons name="apps" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="comunitate"
        options={{
          title: 'Comunitate',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      {/* Harta — ascunsă din tab bar, accesibilă din Dashboard */}
      <Tabs.Screen
        name="harta"
        options={{
          title: 'Hartă',
          href: null, // ascuns din tab bar
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
