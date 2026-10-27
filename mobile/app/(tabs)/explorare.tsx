/**
 * Tab Explorează — hub pentru descoperire servicii, hartă, module platform.
 * Structură: bară căutare → filtre rapide → hartă embedded → shortcut module hub.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';

type Category = { key: string; emoji: string; labelKey: string };

const CATEGORIES: Category[] = [
  { key: 'vet',     emoji: '🏥', labelKey: 'map.vets' },
  { key: 'park',   emoji: '🌳', labelKey: 'map.parks' },
  { key: 'shop',   emoji: '🛍️', labelKey: 'map.shops' },
  { key: 'shelter',emoji: '🏠', labelKey: 'map.shelters' },
  { key: 'event',  emoji: '🎪', labelKey: 'map.events' },
];

const MODULE_SHORTCUTS = [
  { id: 'petday',      emoji: '🏡', nameKey: 'petdayName',      route: '/modul/petday' },
  { id: 'pettraining', emoji: '🎓', nameKey: 'pettrainingName', route: '/modul/pettraining' },
  { id: 'petmarket',   emoji: '🛍️', nameKey: 'petmarketName',   route: '/modul/petmarket' },
  { id: 'adoptii',     emoji: '🏠', nameKey: 'adoptiiName',     route: '/modul/adoptii' },
  { id: 'petpassport', emoji: '✈️', nameKey: 'petpassportName', route: '/modul/petpassport' },
  { id: 'petbreeding', emoji: '🌸', nameKey: 'petbreedingName', route: '/modul/petbreeding' },
];

export default function ExplorareScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize2xl, fontFamily: theme.typography.fontFamilyBold }}>
            {t('explore.title', 'Explorează')}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: 2 }}>
            {t('explore.subtitle', 'Găsește servicii, locuri și comunități')}
          </Text>
        </View>

        {/* Search bar */}
        <View style={[styles.searchRow, { marginHorizontal: theme.spacing.lg, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text, fontSize: theme.typography.fontSizeMd }]}
            placeholder={t('explore.searchPlaceholder', 'Caută veterinari, parcuri, traineri...')}
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filtre rapide */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing.md }}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8, flexDirection: 'row' }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setActiveFilter(activeFilter === c.key ? null : c.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: activeFilter === c.key ? theme.colors.primaryLight : theme.colors.surface,
                  borderColor: activeFilter === c.key ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
              <Text style={{ color: activeFilter === c.key ? theme.colors.primary : theme.colors.text, fontSize: theme.typography.fontSizeXs, fontWeight: '600' }}>
                {t(c.labelKey, c.key)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Buton hartă */}
        <Pressable
          onPress={() => router.push('/(tabs)/harta')}
          style={[styles.mapBtn, { margin: theme.spacing.lg, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.mapBtnInner}>
            <Ionicons name="map" size={28} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold }}>
                {t('explore.openMap', 'Deschide harta')}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                {t('explore.mapDesc', 'Vets, parcuri, magazine, evenimente în apropiere')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </View>
        </Pressable>

        {/* Servicii & module */}
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <View style={[styles.sectionHeader, { marginBottom: theme.spacing.md }]}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
              {t('explore.services', 'Servicii')}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/module')}>
              <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeSm }}>
                {t('explore.allModules', 'Toate modulele →')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {MODULE_SHORTCUTS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push(m.route as any)}
                style={[styles.serviceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Text style={{ fontSize: 28, marginBottom: 6 }}>{m.emoji}</Text>
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXs, fontWeight: '600', textAlign: 'center' }}>
                  {t(`modules.${m.nameKey}`, m.nameKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 8 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  mapBtn: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  mapBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: {
    width: '30%', minWidth: 90, aspectRatio: 1,
    borderWidth: 1, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', padding: 10,
  },
});
