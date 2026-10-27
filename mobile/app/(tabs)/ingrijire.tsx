/**
 * Tab Îngrijire — hub Care cu shortcut-uri la modulele de sănătate și planificare.
 * Structură: banner status → grid module → shortcuts rapide.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';

type CareModule = {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  route: string;
  badgeKey?: string;
};

const CARE_MODULES: CareModule[] = [
  {
    id: 'petwell',
    emoji: '🩺',
    titleKey: 'care.petwell',
    descKey: 'care.petwellDesc',
    route: '/modul/petwell',
  },
  {
    id: 'petplanner',
    emoji: '📅',
    titleKey: 'care.petplanner',
    descKey: 'care.petplannerDesc',
    route: '/modul/petplanner',
  },
  {
    id: 'petsos',
    emoji: '🚨',
    titleKey: 'care.petsos',
    descKey: 'care.petsosDesc',
    route: '/modul/petsos',
  },
  {
    id: 'petinsurance',
    emoji: '🛡️',
    titleKey: 'care.petinsurance',
    descKey: 'care.petinsuranceDesc',
    route: '/modul/petinsurance',
  },
  {
    id: 'petday',
    emoji: '🏡',
    titleKey: 'care.petday',
    descKey: 'care.petdayDesc',
    route: '/modul/petday',
  },
  {
    id: 'pettraining',
    emoji: '🎓',
    titleKey: 'care.pettraining',
    descKey: 'care.pettrainingDesc',
    route: '/modul/pettraining',
  },
  {
    id: 'petanalytics',
    emoji: '📊',
    titleKey: 'care.petanalytics',
    descKey: 'care.petanalyticsDesc',
    route: '/modul/petanalytics',
  },
];

export default function IngrijireScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize2xl, fontFamily: theme.typography.fontFamilyBold }}>
            {t('care.title', 'Îngrijire')}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: 2 }}>
            {t('care.subtitle', 'Sănătate, planificare și bunăstare')}
          </Text>
        </View>

        {/* Banner acces dosar rapid */}
        <Pressable
          onPress={() => router.push('/(tabs)/animale_mele')}
          style={[styles.banner, { marginHorizontal: theme.spacing.lg, backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
        >
          <Ionicons name="folder-open" size={22} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: theme.typography.fontSizeSm }}>
              {t('care.bannerTitle', 'Dosarele medicale')}
            </Text>
            <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeXs, opacity: 0.8 }}>
              {t('care.bannerDesc', 'Accesează istoricul medical complet al animalelor tale')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
        </Pressable>

        {/* Module grid */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.md }}>
            {t('care.modules', 'Module')}
          </Text>
          {CARE_MODULES.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => router.push(m.route as any)}
              style={[styles.moduleRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={[styles.emojiBox, { backgroundColor: theme.colors.background }]}>
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontWeight: '600' }}>
                  {t(m.titleKey, m.id)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, marginTop: 2 }}>
                  {t(m.descKey, '')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Link spre modulul complet */}
        <Pressable
          onPress={() => router.push('/(tabs)/module')}
          style={[styles.allModulesBtn, { marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, borderColor: theme.colors.border }]}
        >
          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeSm, fontWeight: '600' }}>
            {t('care.allModules', 'Toate modulele platformei →')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 8 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12,
  },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  emojiBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  allModulesBtn: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    alignItems: 'center',
  },
});
