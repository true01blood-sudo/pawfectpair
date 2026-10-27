/**
 * Ecran Hub de Module — grid cu toate cele 14+ module ale platformei.
 * Faza 1 (active) în secțiune dedicată, Faza 2/3 cu badge „coming soon".
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { ModuleCard } from '../../components/module/ModuleCard';
import { MODULES, getModulesByPhase } from '../../lib/modules';

export default function ModuleHubScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();

  const phase1 = getModulesByPhase(1);
  const phase2 = getModulesByPhase(2);
  const phase3 = getModulesByPhase(3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('modules.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {t('modules.subtitle')}
          </Text>
        </View>

        {/* Faza 1 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ✅ {t('modules.faza1')}
          </Text>
          <View style={[styles.phaseBadge, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.phaseBadgeText}>{phase1.length} module</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {phase1.map((m) => <ModuleCard key={m.id} module={m} />)}
        </View>

        {/* Faza 2 */}
        <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🚧 {t('modules.faza2')}
          </Text>
          <View style={[styles.phaseBadge, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.phaseBadgeText, { color: '#1a1410' }]}>{phase2.length} module</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {phase2.map((m) => <ModuleCard key={m.id} module={m} />)}
        </View>

        {/* Faza 3 */}
        <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📋 {t('modules.faza3')}
          </Text>
          <View style={[styles.phaseBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={[styles.phaseBadgeText, { color: theme.colors.text }]}>{phase3.length} module</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {phase3.map((m) => <ModuleCard key={m.id} module={m} />)}
        </View>

        {/* Footer info */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
          <Text style={{ fontSize: 32, textAlign: 'center' }}>🐾</Text>
          <Text style={[styles.footerText, { color: theme.colors.text }]}>
            {MODULES.length} module planificate pentru platforma Pet Care Services
          </Text>
          <Text style={[styles.footerSub, { color: theme.colors.textMuted }]}>
            Dezvoltare etapizată — Faza 1 disponibilă acum, Faza 2 în curs, Faza 3 planificată
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  phaseBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  footer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  footerText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  footerSub: { fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18 },
});
