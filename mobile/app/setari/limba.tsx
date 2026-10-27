/**
 * Ecran selecție limbă & regiune.
 * Permite alegerea manuală sau resetare la detectarea automată.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Card } from '../../components/ui';
import {
  SUPPORTED_LANGUAGES, LANGUAGE_LABELS, changeLanguage, resetToAutoLanguage,
  detectDeviceLanguage, type AppLanguage,
} from '../../lib/i18n';

export default function LanguageScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const { i18n } = useTranslation();
  const currentLang = i18n.language as AppLanguage;
  const detectedLang = detectDeviceLanguage();

  const handleSelect = async (lang: AppLanguage) => {
    await changeLanguage(lang);
  };

  const handleReset = async () => {
    await resetToAutoLanguage();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('language.title') }} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
        {/* Header info */}
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>🌍</Text>
          <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>
            {t('language.title')}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            {t('language.autoDetect')}
          </Text>
          <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 8, fontWeight: '600' }}>
            📱 Detectat: {LANGUAGE_LABELS[detectedLang].flag} {LANGUAGE_LABELS[detectedLang].native}
          </Text>
        </Card>

        {/* Reset la auto-detect */}
        <Button
          title={`🔄 ${t('language.autoDetect')}`}
          variant="outline"
          onPress={handleReset}
          style={{ marginTop: 12 }}
          size="lg"
          fullWidth
        />

        {/* Lista limbi */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: theme.spacing.lg }]}>
          {t('language.selectLanguage')}
        </Text>
        <View style={{ gap: 8 }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const meta = LANGUAGE_LABELS[lang];
            const isActive = currentLang === lang;
            const isDetected = detectedLang === lang;
            return (
              <Pressable
                key={lang}
                onPress={() => handleSelect(lang)}
                style={[
                  styles.langRow,
                  {
                    backgroundColor: isActive ? theme.colors.primaryLight : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 28 }}>{meta.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                    {meta.native}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {meta.region}
                  </Text>
                </View>
                {isDetected && (
                  <View style={[styles.tag, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '600' }}>📱 AUTO</Text>
                  </View>
                )}
                {isActive && (
                  <View style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓ ACTIVĂ</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Info suplimentar */}
        <Card style={{ marginTop: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            🌐 Multi-limbă pe regiuni
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
            Aplicația detectează automat limba dispozitivului la prima rulare. Poți schimba oricând manual din acest ecran. Conținutul specific (articole, evenimente, parteneri locali) se adaptează în Faza 2 pe baza regiunii selectate.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <View key={lang} style={[styles.langChip, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text style={{ color: theme.colors.text, fontSize: 11 }}>{LANGUAGE_LABELS[lang].flag} {LANGUAGE_LABELS[lang].native}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
