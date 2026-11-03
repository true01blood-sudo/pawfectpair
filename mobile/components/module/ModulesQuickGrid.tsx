/**
 * Grid compact cu toate modulele — iconiță + nume, link direct catre fiecare.
 * Inlocuieste singurul punct de acces anterior (buton mic "grid" in
 * Explorare) cu acces organic, vizibil direct pe Home.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme-provider';
import { MODULES } from '../../lib/modules';

export function ModulesQuickGrid() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;

  return (
    <View style={styles.grid}>
      {MODULES.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => m.route && router.push(m.route as any)}
          style={styles.tile}
        >
          <View style={[styles.iconWrap, { backgroundColor: m.color + '22' }]}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
          </View>
          <Text
            style={{ color: s.text, fontSize: 11, fontFamily: theme.typography.fontFamilySemibold, textAlign: 'center', marginTop: 4 }}
            numberOfLines={2}
          >
            {t(`modules.${m.id}Name` as any)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '20%', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
