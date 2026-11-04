/**
 * Card pentru afișarea unui modul în hub-ul de Module.
 * Arată iconiță, nume, descriere, badge Premium dacă e blocat pentru userul curent.
 * Tap → navighează la rută, sau arată prompt de upgrade dacă e Premium și userul nu are acces.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { hasPremiumAccess } from '@pawfectpair/shared';
import { useAppTheme } from '../theme-provider';
import { useProfile } from '../../hooks/useProfile';
import { promptUpgrade } from '../../lib/upgrade-prompt';
import type { AppModule } from '../../lib/modules';

interface ModuleCardProps {
  module: AppModule;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();
  const profile = useProfile();
  const premium = hasPremiumAccess(profile.data);
  const locked = module.tier === 'premium' && !premium;

  const handlePress = () => {
    if (locked) { promptUpgrade(t(`modules.${module.id}Name` as any)); return; }
    if (module.route) router.push(module.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!module.route}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed || !module.route ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: module.color + '22', opacity: locked ? 0.6 : 1 }]}>
        <Text style={{ fontSize: 28 }}>{module.emoji}</Text>
      </View>
      <Text style={[styles.name, { color: locked ? theme.colors.textMuted : theme.colors.text }]} numberOfLines={1}>
        {t(`modules.${module.id}Name` as any)}
      </Text>
      <Text style={[styles.desc, { color: theme.colors.textMuted }]} numberOfLines={2}>
        {t(`modules.${module.id}Desc` as any)}
      </Text>
      {locked && (
        <View style={[styles.phaseBadge, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.phaseText, { color: '#1a1410' }]}>🔒 Premium</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
  },
  phaseBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  phaseText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
