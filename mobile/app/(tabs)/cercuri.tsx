/**
 * Tab Cercuri — hub comunitate: chat-uri, events, petconnect.
 * Structură: shortcut mesaje → evenimente → comunitate → petconnect.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';

type CircleItem = {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  route: string;
  iconName: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
};

const CIRCLE_ITEMS: CircleItem[] = [
  {
    id: 'mesaje',
    emoji: '💬',
    titleKey: 'circles.messages',
    descKey: 'circles.messagesDesc',
    route: '/(tabs)/comunitate',
    iconName: 'chatbubbles',
  },
  {
    id: 'petmatch',
    emoji: '🐾',
    titleKey: 'circles.petmatch',
    descKey: 'circles.petmatchDesc',
    route: '/(tabs)/petmatch',
    iconName: 'heart',
  },
  {
    id: 'petevents',
    emoji: '🎪',
    titleKey: 'circles.petevents',
    descKey: 'circles.peteventsDesc',
    route: '/modul/petevents',
    iconName: 'calendar',
  },
  {
    id: 'petconnect',
    emoji: '🌐',
    titleKey: 'circles.petconnect',
    descKey: 'circles.petconnectDesc',
    route: '/modul/petconnect',
    iconName: 'globe',
  },
  {
    id: 'petresq',
    emoji: '🆘',
    titleKey: 'circles.petresq',
    descKey: 'circles.petresqDesc',
    route: '/modul/petresq',
    iconName: 'alert-circle',
  },
  {
    id: 'petbreeding',
    emoji: '🌸',
    titleKey: 'circles.petbreeding',
    descKey: 'circles.petbreedingDesc',
    route: '/modul/petbreeding',
    iconName: 'flower',
  },
];

export default function CercuriScreen() {
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
            {t('circles.title', 'Cercuri')}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: 2 }}>
            {t('circles.subtitle', 'Comunitate, events și conexiuni')}
          </Text>
        </View>

        {/* Card mesaje primar */}
        <Pressable
          onPress={() => router.push('/(tabs)/comunitate')}
          style={[styles.primaryCard, {
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.md,
            backgroundColor: theme.colors.primaryLight,
            borderColor: theme.colors.primary,
          }]}
        >
          <View style={styles.primaryCardContent}>
            <Ionicons name="chatbubbles" size={32} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeLg, fontWeight: '700' }}>
                {t('circles.goToMessages', 'Mesajele mele')}
              </Text>
              <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeXs, opacity: 0.8, marginTop: 2 }}>
                {t('circles.goToMessagesDesc', 'Conversații cu match-urile tale')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
          </View>
        </Pressable>

        {/* Grid cercuri */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.md }}>
            {t('circles.discover', 'Descoperă')}
          </Text>
          <View style={styles.grid}>
            {CIRCLE_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.route as any)}
                style={[styles.gridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Text style={{ fontSize: 30, marginBottom: 8 }}>{item.emoji}</Text>
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontWeight: '600', textAlign: 'center' }}>
                  {t(item.titleKey, item.id)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                  {t(item.descKey, '')}
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
  primaryCard: {
    borderWidth: 1, borderRadius: 16, overflow: 'hidden',
  },
  primaryCardContent: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '47%', borderWidth: 1, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
});
