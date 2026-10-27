/**
 * Layout grupa (tabs) — 5 tab-uri conform structurii documentului:
 * Acasă | Explorează | Îngrijire | Cercuri | Animalele mele
 *
 * Tab-uri ascunse (accesibile prin router.push, fără href în tab bar):
 *   - petmatch  (accesibil din Acasă și profil animal)
 *   - module    (accesibil din Explorează)
 *   - comunitate (chat-ul existent, accesibil din Cercuri)
 *   - profil    (setări utilizator, accesibil din Animalele mele)
 *   - harta     (wrapat în Explorează)
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
        tabBarActiveTintColor: '#FF6B2D',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: 'PlusJakartaSans_600SemiBold',
          marginTop: 2,
        },
      }}
    >
      {/* ── Tab 1: Acasă ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acasă',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      {/* ── Tab 2: Explorează (hartă + căutare servicii) ── */}
      <Tabs.Screen
        name="explorare"
        options={{
          title: 'Explorează',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} />,
        }}
      />
      {/* ── Tab 3: Îngrijire (hub Care) ── */}
      <Tabs.Screen
        name="ingrijire"
        options={{
          title: 'Îngrijire',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-circle" color={color} size={size} />,
        }}
      />
      {/* ── Tab 4: Cercuri (comunitate + events + connect) ── */}
      <Tabs.Screen
        name="cercuri"
        options={{
          title: 'Cercuri',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      {/* ── Tab 5: Animalele mele (My Pets) ── */}
      <Tabs.Screen
        name="animale_mele"
        options={{
          title: 'Animalele mele',
          tabBarIcon: ({ color, size }) => <Ionicons name="paw" color={color} size={size} />,
        }}
      />

      {/* ── Ascunse din tab bar (accesibile prin router.push) ── */}
      <Tabs.Screen name="petmatch"   options={{ href: null }} />
      <Tabs.Screen name="module"     options={{ href: null }} />
      <Tabs.Screen name="comunitate" options={{ href: null }} />
      <Tabs.Screen name="profil"     options={{ href: null }} />
      <Tabs.Screen name="harta"      options={{ href: null }} />
    </Tabs>
  );
}
