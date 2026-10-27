/**
 * Pedigree / genealogie interactivă — arbore 4 generații.
 * Design: conform mockup "Pedigree" (Luna, CH Golden Sunrise Luna, 4-gen tree,
 * Official pedigree document, View full pedigree).
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../components/theme-provider';
import { usePet } from '../../../hooks';

type PedigreeNode = {
  id: string;
  name: string;
  regName?: string;
  sex: 'M' | 'F';
  emoji?: string;
  sireId?: string;
  damId?: string;
};

// Date demo conform imaginii de design
const DEMO_TREE: Record<string, PedigreeNode> = {
  subject: { id: 'subject', name: 'Luna', regName: 'CH Golden Sunrise Luna', sex: 'F', emoji: '🐕' },
  sire: { id: 'sire', name: 'Sunnydale River King', sex: 'M', emoji: '🐕' },
  dam: { id: 'dam', name: 'Alpine Gold Nala', sex: 'F', emoji: '🐕' },
  sire_sire: { id: 'sire_sire', name: 'Riverside Major', sex: 'M' },
  sire_dam: { id: 'sire_dam', name: 'Sunnydale Bella', sex: 'F' },
  dam_sire: { id: 'dam_sire', name: 'Silverstream Cooper', sex: 'M' },
  dam_dam: { id: 'dam_dam', name: 'Goldenfields Maya', sex: 'F' },
};

type Section = 'overview' | 'pedigree' | 'health' | 'photos' | 'litters';

export default function PedigreeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);

  const [activeSection, setActiveSection] = useState<Section>('pedigree');
  const [expanded, setExpanded] = useState(true);

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'overview', label: t('pedigree.secOverview', 'Prezentare') },
    { key: 'pedigree', label: t('pedigree.secPedigree', 'Pedigree') },
    { key: 'health', label: t('pedigree.secHealth', 'Sănătate') },
    { key: 'photos', label: t('pedigree.secPhotos', 'Poze') },
    { key: 'litters', label: t('pedigree.secLitters', 'Pui') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingLeft: 20 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable hitSlop={8}>
            <Ionicons name="heart-outline" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable hitSlop={8}>
            <Ionicons name="share-outline" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable onPress={() => router.push(`/animale/${id}/edit` as any)} style={{ paddingRight: 20 }} hitSlop={8}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>
              {t('pedigree.edit', 'Editează')}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Cover foto + info animal */}
        <View style={[styles.coverArea, { backgroundColor: theme.colors.accent }]}>
          <Text style={{ fontSize: 80 }}>{pet ? (pet.species === 'cat' ? '🐱' : '🐕') : '🐕'}</Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          {/* Titlu + badge */}
          <View style={styles.titleRow}>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontFamily: theme.typography.fontFamilyBold }}>
              {pet?.name ?? 'Luna'}
            </Text>
            <View style={[styles.verifiedBadge, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
              <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>
                {t('pedigree.docReviewed', 'Document verificat')}
              </Text>
            </View>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>
            {pet?.breed ?? 'Golden Retriever'} · {t('pedigree.years', '3 ani')} · {pet?.gender === 'female' ? '♀ Femelă' : '♂ Mascul'}
          </Text>
        </View>

        {/* Tab-uri secțiuni */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 0, flexDirection: 'row', marginTop: 16 }}>
          {SECTIONS.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => setActiveSection(s.key)}
              style={[styles.sectionTab, {
                borderBottomWidth: activeSection === s.key ? 2 : 0,
                borderBottomColor: theme.colors.primary,
              }]}
            >
              <Text style={{
                color: activeSection === s.key ? theme.colors.primary : theme.colors.textMuted,
                fontWeight: activeSection === s.key ? '700' : '500',
                fontSize: 14,
              }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginBottom: 20 }} />

        {activeSection === 'pedigree' && (
          <View style={{ paddingHorizontal: 20 }}>
            {/* Titlu arbore */}
            <Pressable onPress={() => setExpanded(!expanded)} style={styles.treeHeader}>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
                {t('pedigree.fourGen', 'Pedigree 4 generații')}
              </Text>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textMuted} />
            </Pressable>

            {expanded && (
              <View style={styles.treeContainer}>
                {/* Gen 1 — subiect */}
                <View style={styles.treeCol}>
                  <PedigreeNodeCard node={DEMO_TREE.subject} theme={theme} isSubject />
                </View>

                {/* Separator */}
                <View style={[styles.treeLine, { backgroundColor: theme.colors.border }]} />

                {/* Gen 2 — părinți */}
                <View style={styles.treeCol}>
                  <PedigreeNodeCard node={DEMO_TREE.sire} theme={theme} label={t('pedigree.sire', 'Tată')} />
                  <View style={{ height: 20 }} />
                  <PedigreeNodeCard node={DEMO_TREE.dam} theme={theme} label={t('pedigree.dam', 'Mamă')} />
                </View>

                {/* Separator */}
                <View style={[styles.treeLine, { backgroundColor: theme.colors.border }]} />

                {/* Gen 3 — bunici */}
                <View style={styles.treeCol}>
                  <PedigreeNodeCard node={DEMO_TREE.sire_sire} theme={theme} label={t('pedigree.grandfather', 'Bunic')} small />
                  <PedigreeNodeCard node={DEMO_TREE.sire_dam} theme={theme} label={t('pedigree.grandmother', 'Bunică')} small />
                  <PedigreeNodeCard node={DEMO_TREE.dam_sire} theme={theme} label={t('pedigree.grandfather', 'Bunic')} small />
                  <PedigreeNodeCard node={DEMO_TREE.dam_dam} theme={theme} label={t('pedigree.grandmother', 'Bunică')} small />
                </View>
              </View>
            )}

            {/* Document oficial */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 10 }}>
                {t('pedigree.officialDoc', 'Document oficial')}
              </Text>
              <Pressable style={[styles.docRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.docIcon, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>
                    {t('pedigree.officialPedigreeDoc', 'Document pedigree oficial')}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    Swiss Stud Book (SKG)
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
                    <Text style={{ color: '#16A34A', fontSize: 12 }}>
                      {t('pedigree.docVerified', 'Document verificat · 12 Mar 2024')}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            {/* View full pedigree link */}
            <Pressable style={[styles.docRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 8 }]}>
              <View style={[styles.docIcon, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="list" size={20} color={theme.colors.primary} />
              </View>
              <Text style={{ flex: 1, color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>
                {t('pedigree.viewFull', 'Vezi pedigree complet (4 generații)')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        )}

        {activeSection === 'overview' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>
              {t('pedigree.overviewComingSoon', 'Informații generale despre animal — în curând.')}
            </Text>
          </View>
        )}

        {activeSection === 'health' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>
              {t('pedigree.healthComingSoon', 'Teste de sănătate și certificate — în curând.')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PedigreeNodeCard({ node, theme, label, isSubject = false, small = false }: {
  node: PedigreeNode;
  theme: any;
  label?: string;
  isSubject?: boolean;
  small?: boolean;
}) {
  return (
    <View style={[
      styles.pedigreeNode,
      {
        backgroundColor: isSubject ? theme.colors.surface : theme.colors.background,
        borderColor: isSubject ? theme.colors.primary : theme.colors.border,
        borderWidth: isSubject ? 2 : 1,
        minHeight: small ? 52 : 70,
        padding: small ? 8 : 10,
        marginBottom: small ? 6 : 0,
      },
    ]}>
      {label && (
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
      )}
      {node.emoji && !small && (
        <Text style={{ fontSize: 20, marginBottom: 4 }}>{node.emoji}</Text>
      )}
      <Text style={{ color: theme.colors.text, fontSize: small ? 11 : 13, fontWeight: '700', numberOfLines: 2 }}>
        {node.name}
      </Text>
      {node.regName && (
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>{node.regName}</Text>
      )}
      <Text style={{ color: node.sex === 'M' ? '#3B82F6' : '#EC4899', fontSize: 11, marginTop: 2 }}>
        {node.sex === 'M' ? '♂' : '♀'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  coverArea: {
    height: 200, alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  sectionTab: { paddingHorizontal: 14, paddingVertical: 10, marginRight: 4 },
  treeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  treeContainer: { flexDirection: 'row', alignItems: 'center', gap: 0, overflow: 'hidden' },
  treeCol: { flex: 1, gap: 6 },
  treeLine: { width: 2, alignSelf: 'stretch', marginHorizontal: 4 },
  pedigreeNode: { borderRadius: 10, alignItems: 'center' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  docIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
