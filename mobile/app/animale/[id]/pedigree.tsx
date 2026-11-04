/**
 * Pedigree / genealogie — arbore 4 generații, date reale
 * (pet_pedigree_entries), editabil de proprietar.
 * Design: conform mockup "Pedigree" (4-gen tree, Official pedigree document).
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../components/theme-provider';
import { Input, Button } from '../../../components/ui';
import { usePet } from '../../../hooks';
import { usePedigreeEntries, useUpsertPedigreeEntry } from '../../../hooks/useMedicalShares';
import type { PedigreeEntryRow, PedigreeRelation } from '../../../lib/supabase/queries';

function getPetAge(birthDate: string): string {
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
  return years < 1 ? '< 1 an' : `${years} ${years === 1 ? 'an' : 'ani'}`;
}

function comingSoon() {
  Alert.alert('În curând', 'Această secțiune vine într-o versiune viitoare.');
}

const RELATION_LABEL: Record<PedigreeRelation, string> = {
  sire: 'Tată',
  dam: 'Mamă',
  paternal_grandsire: 'Bunic patern',
  paternal_granddam: 'Bunică paternă',
  maternal_grandsire: 'Bunic matern',
  maternal_granddam: 'Bunică maternă',
};
const RELATION_SEX: Record<PedigreeRelation, 'M' | 'F'> = {
  sire: 'M', dam: 'F',
  paternal_grandsire: 'M', paternal_granddam: 'F',
  maternal_grandsire: 'M', maternal_granddam: 'F',
};

type Section = 'overview' | 'pedigree' | 'health' | 'photos' | 'litters';

export default function PedigreeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const entriesQ = usePedigreeEntries(id);
  const upsertEntry = useUpsertPedigreeEntry(id ?? '');

  const [activeSection, setActiveSection] = useState<Section>('pedigree');
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<PedigreeRelation | null>(null);
  const [editName, setEditName] = useState('');
  const [editRegisteredName, setEditRegisteredName] = useState('');
  const [editRegistry, setEditRegistry] = useState('');

  const entriesByRelation = useMemo(() => {
    const map = new Map<PedigreeRelation, PedigreeEntryRow>();
    for (const e of entriesQ.data ?? []) map.set(e.relation, e);
    return map;
  }, [entriesQ.data]);

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'overview', label: t('pedigree.secOverview', 'Prezentare') },
    { key: 'pedigree', label: t('pedigree.secPedigree', 'Pedigree') },
    { key: 'health', label: t('pedigree.secHealth', 'Sănătate') },
    { key: 'photos', label: t('pedigree.secPhotos', 'Poze') },
    { key: 'litters', label: t('pedigree.secLitters', 'Pui') },
  ];

  function openEditor(relation: PedigreeRelation) {
    const existing = entriesByRelation.get(relation);
    setEditing(relation);
    setEditName(existing?.name ?? '');
    setEditRegisteredName(existing?.registered_name ?? '');
    setEditRegistry(existing?.registry ?? '');
  }

  function closeEditor() {
    setEditing(null);
    setEditName('');
    setEditRegisteredName('');
    setEditRegistry('');
  }

  function saveEntry() {
    if (!editing || !editName.trim()) return;
    upsertEntry.mutate(
      {
        relation: editing,
        name: editName.trim(),
        registered_name: editRegisteredName.trim() || null,
        registry: editRegistry.trim() || null,
      },
      {
        onSuccess: closeEditor,
        onError: (e: Error) => Alert.alert('Eroare', e.message || 'Nu am putut salva.'),
      }
    );
  }

  async function sharePedigree() {
    try {
      await Share.share({ message: `Pedigree-ul lui ${pet?.name ?? 'animalul meu'} pe Pet Care.` });
    } catch {}
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingLeft: 20 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={comingSoon} hitSlop={8}>
            <Ionicons name="heart-outline" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable onPress={sharePedigree} hitSlop={8}>
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
          <Text style={{ fontSize: 80 }}>{pet ? (pet.species === 'Pisică' ? '🐱' : '🐕') : '🐕'}</Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          {/* Titlu + badge */}
          <View style={styles.titleRow}>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontFamily: theme.typography.fontFamilyBold }}>
              {pet?.name ?? '—'}
            </Text>
            {pet?.pedigree_registered && (
              <View style={[styles.verifiedBadge, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
                <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>
                  Pedigree înregistrat
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>
            {pet?.breed ?? pet?.species ?? ''}
            {pet?.birth_date ? ` · ${getPetAge(pet.birth_date)}` : ''}
            {pet?.sex === 'female' ? ' · ♀ Femelă' : pet?.sex === 'male' ? ' · ♂ Mascul' : ''}
          </Text>
        </View>

        {/* Tab-uri secțiuni */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 0, flexDirection: 'row', marginTop: 16 }}>
          {SECTIONS.map((s) => (
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
            <Pressable onPress={() => setExpanded(!expanded)} style={styles.treeHeader}>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
                {t('pedigree.fourGen', 'Pedigree 4 generații')}
              </Text>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textMuted} />
            </Pressable>

            {expanded && (
              <View style={styles.treeContainer}>
                {/* Gen 1 — subiect (animalul real) */}
                <View style={styles.treeCol}>
                  <View style={[styles.pedigreeNode, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 2, minHeight: 70, padding: 10 }]}>
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{pet?.species === 'Pisică' ? '🐱' : '🐕'}</Text>
                    <Text numberOfLines={2} style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>
                      {pet?.name ?? '—'}
                    </Text>
                    <Text style={{ color: pet?.sex === 'male' ? '#3B82F6' : '#EC4899', fontSize: 11, marginTop: 2 }}>
                      {pet?.sex === 'male' ? '♂' : pet?.sex === 'female' ? '♀' : ''}
                    </Text>
                  </View>
                </View>

                <View style={[styles.treeLine, { backgroundColor: theme.colors.border }]} />

                {/* Gen 2 — părinți */}
                <View style={styles.treeCol}>
                  <PedigreeNodeCard relation="sire" entry={entriesByRelation.get('sire')} theme={theme} onPress={() => openEditor('sire')} />
                  <View style={{ height: 20 }} />
                  <PedigreeNodeCard relation="dam" entry={entriesByRelation.get('dam')} theme={theme} onPress={() => openEditor('dam')} />
                </View>

                <View style={[styles.treeLine, { backgroundColor: theme.colors.border }]} />

                {/* Gen 3 — bunici */}
                <View style={styles.treeCol}>
                  <PedigreeNodeCard relation="paternal_grandsire" entry={entriesByRelation.get('paternal_grandsire')} theme={theme} small onPress={() => openEditor('paternal_grandsire')} />
                  <PedigreeNodeCard relation="paternal_granddam" entry={entriesByRelation.get('paternal_granddam')} theme={theme} small onPress={() => openEditor('paternal_granddam')} />
                  <PedigreeNodeCard relation="maternal_grandsire" entry={entriesByRelation.get('maternal_grandsire')} theme={theme} small onPress={() => openEditor('maternal_grandsire')} />
                  <PedigreeNodeCard relation="maternal_granddam" entry={entriesByRelation.get('maternal_granddam')} theme={theme} small onPress={() => openEditor('maternal_granddam')} />
                </View>
              </View>
            )}

            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 12 }}>
              Atinge un câmp gol pentru a adăuga un strămoș.
            </Text>

            {/* Document oficial — date reale din profilul animalului */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 10 }}>
                {t('pedigree.officialDoc', 'Document oficial')}
              </Text>
              <View style={[styles.docRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.docIcon, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  {pet?.pedigree_registered ? (
                    <>
                      <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>
                        {pet.pedigree_registry || 'Registru genealogic'}
                      </Text>
                      {pet.pedigree_number && (
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Nr. {pet.pedigree_number}</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>
                        Neînregistrat
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        Adaugă datele din Editează profil.
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
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

        {activeSection === 'photos' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>Galerie foto — în curând.</Text>
          </View>
        )}

        {activeSection === 'litters' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>Istoric pui — în curând.</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal editare strămoș */}
      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={closeEditor}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold, marginBottom: 16 }}>
              {editing ? RELATION_LABEL[editing] : ''}
            </Text>
            <Input label="Nume" value={editName} onChangeText={setEditName} placeholder="Ex: Sunnydale River King" maxLength={80} />
            <Input label="Nume înregistrat / titlu (opțional)" value={editRegisteredName} onChangeText={setEditRegisteredName} placeholder="Ex: CH Sunnydale River King" maxLength={120} />
            <Input label="Registru (opțional)" value={editRegistry} onChangeText={setEditRegistry} placeholder="Ex: FCI, AKC" maxLength={40} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Button title="Anulează" variant="outline" onPress={closeEditor} style={{ flex: 1 }} />
              <Button title="Salvează" onPress={saveEntry} disabled={!editName.trim()} loading={upsertEntry.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PedigreeNodeCard({ relation, entry, theme, onPress, small = false }: {
  relation: PedigreeRelation;
  entry: PedigreeEntryRow | undefined;
  theme: any;
  onPress: () => void;
  small?: boolean;
}) {
  const sex = RELATION_SEX[relation];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pedigreeNode,
        {
          backgroundColor: theme.colors.background,
          borderColor: entry ? theme.colors.border : theme.colors.border,
          borderStyle: entry ? 'solid' : 'dashed',
          minHeight: small ? 52 : 70,
          padding: small ? 8 : 10,
          marginBottom: small ? 6 : 0,
        },
      ]}
    >
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {RELATION_LABEL[relation]}
      </Text>
      {entry ? (
        <>
          <Text numberOfLines={2} style={{ color: theme.colors.text, fontSize: small ? 11 : 13, fontWeight: '700' }}>
            {entry.name}
          </Text>
          {entry.registered_name && (
            <Text numberOfLines={1} style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>{entry.registered_name}</Text>
          )}
          <Text style={{ color: sex === 'M' ? '#3B82F6' : '#EC4899', fontSize: 11, marginTop: 2 }}>
            {sex === 'M' ? '♂' : '♀'}
          </Text>
        </>
      ) : (
        <Ionicons name="add-circle-outline" size={small ? 18 : 22} color={theme.colors.textMuted} />
      )}
    </Pressable>
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
  pedigreeNode: { borderRadius: 10, alignItems: 'center', borderWidth: 1, justifyContent: 'center' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  docIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
});
