/**
 * Ecran Hub de Module — grid cu toate modulele platformei, cu descriere.
 * Toate modulele sunt live; nu mai exista nicio impartire pe faze
 * (framing-ul de "dezvoltare etapizata" a fost eliminat — era invechit).
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { ModuleCard } from '../../components/module/ModuleCard';
import { MODULES } from '../../lib/modules';

export default function ModuleHubScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('modules.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {t('modules.subtitle')}
          </Text>
        </View>

        <View style={styles.grid}>
          {MODULES.map((m) => <ModuleCard key={m.id} module={m} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
});
