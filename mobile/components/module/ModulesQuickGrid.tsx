/**
 * Grid compact cu toate modulele — iconiță + nume, link direct catre fiecare.
 * Inlocuieste singurul punct de acces anterior (buton mic "grid" in
 * Explorare) cu acces organic, vizibil direct pe Home.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { hasPremiumAccess } from '@pawfectpair/shared';
import { useAppTheme } from '../theme-provider';
import { useProfile } from '../../hooks/useProfile';
import { MODULES } from '../../lib/modules';
import { promptUpgrade } from '../../lib/upgrade-prompt';

export function ModulesQuickGrid() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;
  const profile = useProfile();
  const premium = hasPremiumAccess(profile.data);

  return (
    <View style={styles.grid}>
      {MODULES.map((m) => {
        const locked = m.tier === 'premium' && !premium;
        return (
          <Pressable
            key={m.id}
            onPress={() => {
              if (locked) { promptUpgrade(t(`modules.${m.id}Name` as any)); return; }
              if (m.route) router.push(m.route as any);
            }}
            style={styles.tile}
          >
            <View style={[styles.iconWrap, { backgroundColor: m.color + '22', opacity: locked ? 0.5 : 1 }]}>
              <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              {locked && (
                <View style={[styles.lockBadge, { backgroundColor: s.textMuted, borderColor: s.background }]}>
                  <Text style={{ fontSize: 8 }}>🔒</Text>
                </View>
              )}
            </View>
            <Text
              style={{ color: locked ? s.textMuted : s.text, fontSize: 11, fontFamily: theme.typography.fontFamilySemibold, textAlign: 'center', marginTop: 4 }}
              numberOfLines={2}
            >
              {t(`modules.${m.id}Name` as any)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '20%', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockBadge: {
    position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
});
