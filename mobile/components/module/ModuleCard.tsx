/**
 * Card pentru afișarea unui modul în hub-ul de Module.
 * Arată iconiță, nume, descriere, fază (badge colorat).
 * Tap → navighează la rută sau deschide modal „coming soon".
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme-provider';
import type { AppModule } from '../../lib/modules';
import type { ModulePhase } from '../../lib/modules';

interface ModuleCardProps {
  module: AppModule;
}

const PHASE_LABELS: Record<ModulePhase, { key: string; bg: string; fg: string }> = {
  1: { key: 'modules.faza1', bg: '#16A34A', fg: '#fff' },
  2: { key: 'modules.faza2', bg: '#F59E0B', fg: '#1a1410' },
  3: { key: 'modules.faza3', bg: '#94A3B8', fg: '#1a1410' },
};

export function ModuleCard({ module }: ModuleCardProps) {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();
  const phaseInfo = PHASE_LABELS[module.phase];

  const handlePress = () => {
    if (module.route) {
      router.push(module.route as any);
    }
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
      <View style={[styles.iconWrap, { backgroundColor: module.color + '22' }]}>
        <Text style={{ fontSize: 28 }}>{module.emoji}</Text>
      </View>
      <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
        {t(`modules.${module.id}Name` as any)}
      </Text>
      <Text style={[styles.desc, { color: theme.colors.textMuted }]} numberOfLines={2}>
        {t(`modules.${module.id}Desc` as any)}
      </Text>
      <View
        style={[
          styles.phaseBadge,
          module.status === 'live' ? { backgroundColor: '#16A34A' } : { backgroundColor: phaseInfo.bg },
        ]}
      >
        <Text style={[styles.phaseText, { color: module.status === 'live' ? '#fff' : phaseInfo.fg }]}>
          {module.status === 'live' ? 'LIVE' : t(phaseInfo.key as any)}
        </Text>
      </View>
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
