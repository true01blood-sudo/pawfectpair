/**
 * Dosar medical + acces temporar grantat (R01/R02 din document).
 * Design: tabs All records/Vaccinations/Tests, share modal cu date access temporar.
 * Conform mockup "Medical file + Share records (Temporary record access)".
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
  Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../components/theme-provider';
import { usePet, useMedicalRecords } from '../../../hooks';
import { formatDateRO } from '@pawfectpair/shared';

type RecordTab = 'all' | 'vaccinations' | 'tests';

type ActiveShare = {
  id: string;
  providerName: string;
  providerRole: string;
  providerClinic: string;
  expiresAt: string;
  purpose: string;
};

const DEMO_ACTIVE_SHARES: ActiveShare[] = [
  {
    id: 'sh1',
    providerName: 'Dr. Marco Bianchi',
    providerRole: 'Veterinar',
    providerClinic: 'Rome Vet Clinic',
    expiresAt: '22 Nov 2026, 18:00',
    purpose: 'Travel vet',
  },
];

export default function DosarScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const { data: records } = useMedicalRecords(id);

  const [activeTab, setActiveTab] = useState<RecordTab>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [shareStep, setShareStep] = useState<1 | 2>(1);

  const tabs: { key: RecordTab; label: string }[] = [
    { key: 'all', label: t('dosar.tabAll', 'Toate') },
    { key: 'vaccinations', label: t('dosar.tabVacc', 'Vaccinări') },
    { key: 'tests', label: t('dosar.tabTests', 'Teste') },
  ];

  const filteredRecords = (records ?? []).filter((r: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'vaccinations') return r.record_type === 'vaccination';
    if (activeTab === 'tests') return ['blood_test', 'xray', 'other'].includes(r.record_type);
    return true;
  });

  function toggleRecord(rid: string) {
    setSelectedRecords((prev) =>
      prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]
    );
  }

  function handleWithdrawShare(shareId: string) {
    Alert.alert(
      t('dosar.withdrawTitle', 'Retrage accesul'),
      t('dosar.withdrawConfirm', 'Ești sigur că vrei să retragi accesul?'),
      [
        { text: t('app.cancel', 'Anulează'), style: 'cancel' },
        { text: t('dosar.withdraw', 'Retrage'), style: 'destructive', onPress: () => {} },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20, borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: theme.typography.fontFamilyBold }}>
          {pet ? `${t('dosar.title', 'Dosar medical')} — ${pet.name}` : t('dosar.title', 'Dosar medical')}
        </Text>
        <Pressable onPress={() => router.push(`/animale/${id}/adauga-inregistrare` as any)} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Pet identity card */}
        {pet && (
          <View style={[styles.petCard, { marginHorizontal: 20, marginTop: 16, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.petAvatar, { backgroundColor: theme.colors.accent }]}>
              <Text style={{ fontSize: 28 }}>{pet.species === 'cat' ? '🐱' : pet.species === 'horse' ? '🐴' : '🐶'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
                {pet.name}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {pet.breed || pet.species} · {pet.gender === 'female' ? 'Femelă' : 'Mascul'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(`/animale/${id}/pedigree` as any)}
              style={{ alignItems: 'center' }}
            >
              <Ionicons name="git-network" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontSize: 10, marginTop: 2 }}>Pedigree</Text>
            </Pressable>
          </View>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: 'row', paddingVertical: 12 }}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabChip, {
                backgroundColor: activeTab === tab.key ? theme.colors.primary : theme.colors.surface,
                borderColor: activeTab === tab.key ? theme.colors.primary : theme.colors.border,
              }]}
            >
              <Text style={{ color: activeTab === tab.key ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Alergii & medicație permanentă */}
        <View style={[styles.allergyCard, { marginHorizontal: 20, backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Ionicons name="warning-outline" size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 13 }}>
              {t('dosar.allergies', 'Alergii & medicație')}
            </Text>
            <Text style={{ color: '#92400E', fontSize: 12, marginTop: 2 }}>
              {t('dosar.noAllergies', 'Fără alergii cunoscute')} · {t('dosar.monthlyTreatment', 'Tratament lunar purici & căpușe')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D97706" />
        </View>

        {/* Lista înregistrări */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold }}>
              {t('dosar.recentRecords', 'Înregistrări recente')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              {t('dosar.newestFirst', 'Cele mai noi primele')}
            </Text>
          </View>

          {filteredRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36 }}>📋</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                {t('dosar.noRecords', 'Nicio înregistrare în această categorie')}
              </Text>
            </View>
          ) : (
            filteredRecords.map((r: any) => (
              <Pressable
                key={r.id}
                style={[styles.recordRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={[styles.recordDot, { backgroundColor: '#22C55E' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>
                    {r.title || r.record_type}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {r.provider_name || 'Veterinar'} · {formatDateRO(r.date)}
                  </Text>
                  {r.record_type && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      <View style={[styles.typeChip, { backgroundColor: theme.colors.background }]}>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{r.record_type}</Text>
                      </View>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </Pressable>
            ))
          )}
        </View>

        {/* Acces activ grantat */}
        {DEMO_ACTIVE_SHARES.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 10 }}>
              {t('dosar.activeSharing', 'Acces activ')}
            </Text>
            {DEMO_ACTIVE_SHARES.map((s) => (
              <View key={s.id} style={[styles.shareCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="airplane" size={14} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>
                      {s.purpose}
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>
                    {s.providerName}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    {s.providerClinic} · Expiră {s.expiresAt}
                  </Text>
                </View>
                <Pressable onPress={() => handleWithdrawShare(s.id)}>
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                    {t('dosar.withdraw', 'Retrage')}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Notă footer */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={[styles.infoBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, flex: 1 }}>
              {t('dosar.downloadNote', 'Copiile descărcate nu pot fi retrase odată partajate.')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Buton Share Selected Records */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Pressable
          onPress={() => setShowShareModal(true)}
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {t('dosar.shareRecords', 'Partajează înregistrări selectate')}
          </Text>
        </Pressable>
      </View>

      {/* Modal Share */}
      <Modal visible={showShareModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Pressable onPress={() => { setShowShareModal(false); setShareStep(1); setSelectedRecords([]); }}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold }}>
              {t('dosar.shareTitle', 'Partajează înregistrări')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Titlu acces temporar */}
            <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: theme.typography.fontFamilyBold, marginBottom: 4 }}>
              {t('dosar.temporaryAccess', 'Acces temporar')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 20 }}>
              {t('dosar.temporaryAccessDesc', `Partajează dosarul medical al lui ${pet?.name ?? 'animalului'} cu un veterinar de încredere, pentru o perioadă limitată.`)}
            </Text>

            {/* Provider selector */}
            <Pressable style={[styles.providerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[styles.providerAvatar, { backgroundColor: theme.colors.accent }]}>
                <Text style={{ fontSize: 22 }}>👩‍⚕️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
                  Dr. Andrea Rossi
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  Lake Vet · Veterinar · Lugano
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>

            {/* Selectare înregistrări */}
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginTop: 20, marginBottom: 12 }}>
              {t('dosar.selectRecords', 'Selectează înregistrări')}
            </Text>

            {[
              { id: 'vacc', name: 'Fișă vaccinuri', date: '3 Oct 2026', type: 'PDF (2 pag.)', selected: true },
              { id: 'tests', name: 'Teste recente', date: '15 Aug 2026', type: 'PDF (4 pag.)', selected: true },
              { id: 'checkup', name: 'Control anual', date: '12 Nov 2026', type: 'PDF (3 pag.)', selected: false },
            ].map((rec) => (
              <Pressable
                key={rec.id}
                onPress={() => toggleRecord(rec.id)}
                style={[styles.recordSelectRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={[styles.checkbox, {
                  backgroundColor: (selectedRecords.includes(rec.id) || rec.selected) ? theme.colors.primary : 'transparent',
                  borderColor: (selectedRecords.includes(rec.id) || rec.selected) ? theme.colors.primary : theme.colors.border,
                }]}>
                  {(selectedRecords.includes(rec.id) || rec.selected) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{rec.name}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{rec.date} · {rec.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </Pressable>
            ))}

            {/* Detalii acces */}
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginTop: 20, marginBottom: 12 }}>
              {t('dosar.accessDetails', 'Detalii acces')}
            </Text>
            <View style={styles.accessDatesRow}>
              <View style={[styles.dateBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                <View>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Începe</Text>
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>15 Nov 2026, 09:00</Text>
                </View>
              </View>
              <View style={[styles.dateBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="calendar-outline" size={16} color="#EF4444" />
                <View>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Se termină</Text>
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>22 Nov 2026, 18:00</Text>
                </View>
              </View>
            </View>

            {/* Info expiră automat */}
            <View style={[styles.infoBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', marginTop: 12 }]}>
              <Ionicons name="lock-closed" size={16} color="#16A34A" />
              <Text style={{ color: '#166534', fontSize: 12, flex: 1 }}>
                {t('dosar.autoExpire', 'Accesul expiră automat. Veterinarul poate vedea doar înregistrările selectate — nu poate edita sau șterge nimic.')}
              </Text>
            </View>
          </ScrollView>

          {/* CTA Review sharing */}
          <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
            <Pressable
              onPress={() => setShowShareModal(false)}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {t('dosar.reviewSharing', 'Verifică partajarea →')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1,
  },
  petCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  petAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  tabChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  allergyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  recordDot: { width: 10, height: 10, borderRadius: 5 },
  typeChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  shareCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  bottomBar: {
    flexDirection: 'row', padding: 16, borderTopWidth: 1,
  },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1,
  },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  providerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  recordSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  accessDatesRow: { flexDirection: 'row', gap: 10 },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
});
