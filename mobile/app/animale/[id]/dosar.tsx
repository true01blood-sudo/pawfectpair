/**
 * Dosar medical + acces temporar grantat (R01/R02 din document).
 * Design: tabs All records/Vaccinations/Tests, share modal cu date access temporar.
 * Conform mockup "Medical file + Share records (Temporary record access)".
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { toDateInput } from '@pawfectpair/shared';
import { useAppTheme } from '../../../components/theme-provider';
import { Input, Button } from '../../../components/ui';
import { usePet, useMedicalRecords } from '../../../hooks';
import { useMyVetAppointments } from '../../../hooks/useVetDetail';
import { useActiveShares, useCreateMedicalRecordShare, useRevokeMedicalRecordShare } from '../../../hooks/useMedicalShares';
import { formatDateRO } from '@pawfectpair/shared';

type RecordTab = 'all' | 'vaccinations' | 'tests';

export default function DosarScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const { data: records } = useMedicalRecords(id ?? '');

  const [activeTab, setActiveTab] = useState<RecordTab>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresDate, setExpiresDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toDateInput(d);
  });

  const myVetAppts = useMyVetAppointments();
  const activeShares = useActiveShares(id);
  const createShare = useCreateMedicalRecordShare(id ?? '');
  const revokeShare = useRevokeMedicalRecordShare(id ?? '');

  const myVets = useMemo(() => {
    const seen = new Map<string, { vet_id: string; clinic_name: string }>();
    for (const a of myVetAppts.data ?? []) {
      if (!seen.has(a.vet_id)) seen.set(a.vet_id, { vet_id: a.vet_id, clinic_name: a.vets?.clinic_name ?? 'Cabinet veterinar' });
    }
    return Array.from(seen.values());
  }, [myVetAppts.data]);

  const tabs: { key: RecordTab; label: string }[] = [
    { key: 'all', label: t('dosar.tabAll', 'Toate') },
    { key: 'vaccinations', label: t('dosar.tabVacc', 'Vaccinări') },
    { key: 'tests', label: t('dosar.tabTests', 'Teste') },
  ];

  const filteredRecords = (records ?? []).filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'vaccinations') return r.type === 'vaccination';
    if (activeTab === 'tests') return ['surgery', 'other'].includes(r.type);
    return true;
  });

  function toggleRecord(rid: string) {
    setSelectedRecords((prev) =>
      prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]
    );
  }

  function handleWithdrawShare(shareId: string, vetName: string) {
    Alert.alert(
      t('dosar.withdrawTitle', 'Retrage accesul'),
      `Sigur retragi accesul lui ${vetName}?`,
      [
        { text: t('app.cancel', 'Anulează'), style: 'cancel' },
        {
          text: t('dosar.withdraw', 'Retrage'),
          style: 'destructive',
          onPress: () => revokeShare.mutate(shareId),
        },
      ]
    );
  }

  function resetModal() {
    setShowShareModal(false);
    setSelectedRecords([]);
    setSelectedVetId('');
    setPurpose('');
  }

  function handleSubmitShare() {
    if (!selectedVetId) return;
    const expiresAt = new Date(`${expiresDate}T23:59:59`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      Alert.alert('Dată invalidă', 'Alege o dată de expirare viitoare.');
      return;
    }
    createShare.mutate(
      {
        vet_id: selectedVetId,
        record_ids: selectedRecords.length > 0 ? selectedRecords : null,
        purpose: purpose.trim() || null,
        expires_at: expiresAt.toISOString(),
      },
      {
        onSuccess: () => {
          resetModal();
          Alert.alert('Partajat!', 'Veterinarul poate vedea acum înregistrările selectate, până la expirare.');
        },
        onError: (e: Error) => Alert.alert('Eroare', e.message || 'Nu am putut partaja dosarul.'),
      }
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
              <Text style={{ fontSize: 28 }}>{pet.species === 'Pisică' ? '🐱' : pet.species === 'Iepure' ? '🐰' : '🐶'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
                {pet.name}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {pet.breed || pet.species} · {pet.sex === 'female' ? 'Femelă' : pet.sex === 'male' ? 'Mascul' : 'Sex necunoscut'}
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

        {/* Lista înregistrări */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
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
            filteredRecords.map((r) => (
              <View
                key={r.id}
                style={[styles.recordRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={[styles.recordDot, { backgroundColor: '#22C55E' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>
                    {r.title}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {formatDateRO(r.record_date)}
                    {r.next_due_date ? ` · scadentă: ${formatDateRO(r.next_due_date)}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <View style={[styles.typeChip, { backgroundColor: theme.colors.background }]}>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{r.type}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Acces activ grantat */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 10 }}>
            {t('dosar.activeSharing', 'Acces activ')}
          </Text>
          {(activeShares.data ?? []).length === 0 ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              Nu ai partajat dosarul cu niciun veterinar momentan.
            </Text>
          ) : (
            (activeShares.data ?? []).map((s) => (
              <View key={s.id} style={[styles.shareCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  {s.purpose ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
                      {s.purpose}
                    </Text>
                  ) : null}
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>
                    {s.vets?.clinic_name ?? 'Cabinet veterinar'}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    {s.record_ids ? `${s.record_ids.length} înregistrări` : 'Toate înregistrările'} · Expiră {new Date(s.expires_at).toLocaleDateString('ro-RO')}
                  </Text>
                </View>
                <Pressable onPress={() => handleWithdrawShare(s.id, s.vets?.clinic_name ?? 'veterinarul')}>
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                    {t('dosar.withdraw', 'Retrage')}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Notă footer */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={[styles.infoBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, flex: 1 }}>
              {t('dosar.downloadNote', 'Veterinarul poate doar vedea înregistrările alese, nu le poate edita sau șterge. Accesul expiră automat.')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Buton Share Selected Records */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Pressable
          onPress={() => (myVets.length === 0
            ? Alert.alert('Niciun veterinar', 'Poți partaja dosarul doar cu un cabinet la care ai avut o programare.')
            : setShowShareModal(true))}
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {t('dosar.shareRecords', 'Partajează dosarul cu un veterinar')}
          </Text>
        </Pressable>
      </View>

      {/* Modal Share */}
      <Modal visible={showShareModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Pressable onPress={resetModal}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold }}>
              {t('dosar.shareTitle', 'Partajează înregistrări')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: theme.typography.fontFamilyBold, marginBottom: 4 }}>
              {t('dosar.temporaryAccess', 'Acces temporar')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 20 }}>
              {t('dosar.temporaryAccessDesc', `Partajează dosarul medical al lui ${pet?.name ?? 'animalului'} cu un veterinar de încredere, pentru o perioadă limitată.`)}
            </Text>

            {/* Provider selector */}
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 12 }}>
              Alege veterinarul
            </Text>
            {myVets.map((v) => (
              <Pressable
                key={v.vet_id}
                onPress={() => setSelectedVetId(v.vet_id)}
                style={[styles.providerCard, {
                  marginBottom: 8,
                  borderColor: selectedVetId === v.vet_id ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selectedVetId === v.vet_id ? `${theme.colors.primary}10` : theme.colors.surface,
                }]}
              >
                <View style={[styles.providerAvatar, { backgroundColor: theme.colors.accent }]}>
                  <Text style={{ fontSize: 22 }}>🏥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
                    {v.clinic_name}
                  </Text>
                </View>
                {selectedVetId === v.vet_id && <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />}
              </Pressable>
            ))}

            {/* Selectare înregistrări */}
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginTop: 20, marginBottom: 4 }}>
              {t('dosar.selectRecords', 'Selectează înregistrări')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
              Nicio selecție = toate înregistrările.
            </Text>

            {(records ?? []).map((rec) => (
              <Pressable
                key={rec.id}
                onPress={() => toggleRecord(rec.id)}
                style={[styles.recordSelectRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={[styles.checkbox, {
                  backgroundColor: selectedRecords.includes(rec.id) ? theme.colors.primary : 'transparent',
                  borderColor: selectedRecords.includes(rec.id) ? theme.colors.primary : theme.colors.border,
                }]}>
                  {selectedRecords.includes(rec.id) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{rec.title}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{formatDateRO(rec.record_date)} · {rec.type}</Text>
                </View>
              </Pressable>
            ))}

            {/* Detalii acces */}
            <Text style={{ color: theme.colors.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginTop: 20, marginBottom: 12 }}>
              {t('dosar.accessDetails', 'Detalii acces')}
            </Text>
            <Input
              label="Expiră la (AAAA-LL-ZZ)"
              value={expiresDate}
              onChangeText={setExpiresDate}
              maxLength={10}
              placeholder={toDateInput()}
            />
            <Input
              label="Motiv (opțional)"
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Ex. consult de rutină"
              maxLength={120}
            />

            <View style={[styles.infoBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', marginTop: 4 }]}>
              <Ionicons name="lock-closed" size={16} color="#16A34A" />
              <Text style={{ color: '#166534', fontSize: 12, flex: 1 }}>
                {t('dosar.autoExpire', 'Accesul expiră automat. Veterinarul poate vedea doar înregistrările selectate — nu poate edita sau șterge nimic.')}
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
            <Button
              title="Verifică partajarea →"
              onPress={handleSubmitShare}
              disabled={!selectedVetId || createShare.isPending}
              loading={createShare.isPending}
              fullWidth
              size="lg"
            />
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
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14 },
  providerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  recordSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
});
