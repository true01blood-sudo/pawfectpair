/**
 * Fișa medicală a animalului — istoric medical, scadențe, log greutate,
 * acțiuni: edit profil, greutate, adăugare înregistrare medicală.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../components/theme-provider';
import { Button, Card, StateView, Input } from '../../../components/ui';
import { MedicalRecordItem, WeightChart } from '../../../components/medical';
import {
  usePet, useMedicalRecords, useWeightLogs,
  useCreateMedicalRecord, useDeleteMedicalRecord, useAddWeightLog,
} from '../../../hooks';
import {
  SPECIES_EMOJI, SPECIES_LABELS, calcAge, formatDateRO, toDateInput,
  MEDICAL_TYPE_OPTIONS, MEDICAL_TYPE_LABELS,
  detectOug50Category, oug50Compliance, oug50ChecklistActions, OUG50_ACTION_COLUMN,
} from '@pawfectpair/shared';
import type { MedicalType, Pet } from '@pawfectpair/shared';

const OUG_ACTION_LABEL_KEY: Record<string, string> = {
  owner_18: 'petext.oug50_req_owner_18',
  registration: 'petext.oug50_req_registration',
  microchip: 'petext.oug50_req_microchip',
  insurance: 'petext.oug50_req_insurance',
  sign: 'petext.oug50_req_sign',
  sterilized: 'petext.oug50_req_sterilized',
};

/** Card cadrul legal OUG 55/2002 — afișat doar pentru câini încadrați */
function Oug50ProfileCard({ pet, tr }: { pet: Pet; tr: (k: string, o?: Record<string, unknown>) => string }) {
  const t = useAppTheme();
  const detected = detectOug50Category(pet.breed);
  const category = (pet.oug50_category === 1 || detected === 1) ? 1 : 2;
  const compliance = oug50Compliance(
    {
      oug50_owner_18: pet.oug50_owner_18,
      oug50_registration: pet.oug50_registration,
      oug50_microchip: pet.oug50_microchip,
      oug50_insurance: pet.oug50_insurance,
      oug50_sign: pet.oug50_sign,
      oug50_sterilized: pet.oug50_sterilized,
    },
    category
  );
  const pct = compliance.total > 0 ? Math.round((compliance.done / compliance.total) * 100) : 0;

  return (
    <View
      style={{
        marginTop: t.spacing.md,
        borderRadius: t.radius.lg,
        borderWidth: 1.5,
        borderColor: compliance.complete ? t.colors.success : t.colors.warning,
        backgroundColor: t.colors.surface,
        padding: t.spacing.lg,
        gap: t.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeMd, fontFamily: t.typography.fontFamilyBold, flex: 1 }}>
          {tr('petext.oug50_badge', { cat: category })}
        </Text>
      </View>
      <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm }}>
        {category === 1 ? tr('petext.oug50_cat1') : tr('petext.oug50_cat2')}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.progressTrack, { backgroundColor: t.colors.surfaceAlt }]}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: compliance.complete ? t.colors.success : t.colors.warning }} />
        </View>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs }}>
          {compliance.complete
            ? `✅ ${tr('petext.oug50_complete_ok')}`
            : tr('petext.oug50_progress', { done: compliance.done, total: compliance.total })}
        </Text>
      </View>

      {oug50ChecklistActions(category).map((id) => {
        const done = pet[OUG50_ACTION_COLUMN[id]] === true;
        return (
          <View key={id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ fontSize: 14 }}>{done ? '✅' : '⬜'}</Text>
            <Text style={{ color: done ? t.colors.text : t.colors.textMuted, fontSize: t.typography.fontSizeXs, flex: 1 }}>
              {tr(OUG_ACTION_LABEL_KEY[id])}
            </Text>
          </View>
        );
      })}

      <View style={[styles.ougInfoBox, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text style={{ fontSize: 13 }}>🚨</Text>
          <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXs, flex: 1 }}>
            {tr('petext.oug50_req_muzzle_leash')}
          </Text>
        </View>
        {category === 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ fontSize: 13 }}>🚫</Text>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXs, flex: 1 }}>
              {tr('petext.oug50_req_no_public_venues')}
            </Text>
          </View>
        )}
      </View>

      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs }}>
        ℹ️ {tr('petext.oug50_legal_note')}
      </Text>
    </View>
  );
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useAppTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const pet = usePet(id);
  const medical = useMedicalRecords(id);
  const weight = useWeightLogs(id);
  const createRecord = useCreateMedicalRecord();
  const deleteRecord = useDeleteMedicalRecord();
  const addWeight = useAddWeightLog();

  const [showAddMedical, setShowAddMedical] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);

  const age = pet.data ? calcAge(pet.data.birth_date) : null;
  const lastWeight = weight.data?.[weight.data.length - 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: pet.data?.name ?? 'Animal' }} />
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: t.spacing.xxl , maxWidth: 720, width: '100%', alignSelf: 'center' }}
        refreshControl={
          <RefreshControl
            refreshing={pet.isRefetching || medical.isRefetching}
            onRefresh={() => { pet.refetch(); medical.refetch(); weight.refetch(); }}
            colors={[t.colors.primary]} tintColor={t.colors.primary}
          />
        }
      >
        <StateView loading={pet.isLoading} error={pet.error?.message}>
          {pet.data && (
            <>
              {/* Header animal */}
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {pet.data.photo_url ? (
                  <Image source={{ uri: pet.data.photo_url }} style={{ width: '100%', height: 220 }} contentFit="cover" />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: t.colors.surfaceAlt }]}>
                    <Text style={{ fontSize: 80 }}>{SPECIES_EMOJI[pet.data.species]}</Text>
                  </View>
                )}
                <View style={{ padding: t.spacing.lg }}>
                  <View style={styles.row}>
                    <Text style={{ color: t.colors.text, fontSize: t.typography.fontSize2xl, fontFamily: t.typography.fontFamilyBold, flex: 1 }}>
                      {pet.data.name}
                    </Text>
                    <Text style={{ fontSize: 32 }}>{SPECIES_EMOJI[pet.data.species]}</Text>
                  </View>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeMd }}>
                    {pet.data.breed ? `${pet.data.breed} · ` : ''}{age?.label ?? 'Vârstă necunoscută'}
                  </Text>
                  <View style={[styles.row, { marginTop: t.spacing.sm }]}>
                    <View style={[styles.chip, { backgroundColor: t.colors.primaryLight }]}>
                      <Text style={{ color: t.colors.primaryDark, fontSize: t.typography.fontSizeXs, fontWeight: '600' }}>
                        {SPECIES_LABELS[pet.data.sex]}
                      </Text>
                    </View>
                    <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm, marginLeft: 'auto' }}>
                      Născut: {formatDateRO(pet.data.birth_date)}
                    </Text>
                  </View>
                  {pet.data.notes && (
                    <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm, marginTop: t.spacing.md, lineHeight: 20 }}>
                      {pet.data.notes}
                    </Text>
                  )}
                  {/* Pedigree (câini & pisici) */}
                  {pet.data.pedigree_registered && (
                    <View style={[styles.pedigreeRow, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border, marginTop: t.spacing.md }]}>
                      <Text style={{ fontSize: 16 }}>📜</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXs, fontFamily: t.typography.fontFamilyBold }}>
                          {tr('petext.pedigree_show')}
                          {pet.data.pedigree_registry ? ` · ${pet.data.pedigree_registry}` : ''}
                        </Text>
                        {pet.data.pedigree_number ? (
                          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs }}>
                            {pet.data.pedigree_number}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                </View>
              </Card>

              {/* Cadrul legal OUG 55/2002 — doar câini încadrați */}
              {pet.data.species === 'Câine' &&
                (pet.data.dangerous_breed || detectOug50Category(pet.data.breed) > 0) && (
                  <Oug50ProfileCard pet={pet.data} tr={tr} />
                )}

              {/* Acțiuni rapide */}
              <View style={[styles.row, { gap: 8, marginTop: t.spacing.md }]}>
                <Button title="✏️ Editează" variant="outline" onPress={() => router.push(`/animale/${id}/edit`)} style={{ flex: 1 }} />
                <Button title="⚖️ Greutate" variant="outline" onPress={() => router.push(`/animale/${id}/greutate`)} style={{ flex: 1 }} />
              </View>

              {/* Card greutate actuală */}
              {lastWeight && (
                <Card style={{ marginTop: t.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.weightIcon, { backgroundColor: t.colors.primaryLight }]}>
                    <Text style={{ fontSize: 28 }}>⚖️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm }}>Ultima cântărire</Text>
                    <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXl, fontFamily: t.typography.fontFamilyBold }}>
                      {lastWeight.weight_kg} kg
                    </Text>
                    <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs }}>
                      {formatDateRO(lastWeight.measured_at)}
                    </Text>
                  </View>
                </Card>
              )}

              {/* Secțiune medicală */}
              <View style={[styles.sectionHeader, { marginTop: t.spacing.lg }]}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold }}>
                  Fișă medicală
                </Text>
                <Button title="+ Adaugă" size="sm" variant="ghost" onPress={() => setShowAddMedical(true)} />
              </View>

              <StateView
                loading={medical.isLoading}
                error={medical.error?.message}
                empty={medical.data?.length === 0}
                emptyText={'Nu există înregistrări medicale. Apasă pe „+ Adaugă" pentru a crea prima.'}
              >
                {medical.data?.map((r) => (
                  <MedicalRecordItem key={r.id} record={r} onDelete={(rid) => {
                    Alert.alert('Ștergere', 'Sigur ștergi această înregistrare?', [
                      { text: 'Anulează', style: 'cancel' },
                      { text: 'Șterge', style: 'destructive', onPress: () => deleteRecord.mutate(rid) },
                    ]);
                  }} />
                ))}
              </StateView>

              {/* Chart greutate */}
              <View style={[styles.sectionHeader, { marginTop: t.spacing.lg }]}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold }}>
                  Evoluție greutate
                </Text>
              </View>
              <WeightChart logs={weight.data ?? []} />
            </>
          )}
        </StateView>
      </ScrollView>

      {/* Modal adăugare înregistrare medicală */}
      <AddMedicalModal
        visible={showAddMedical}
        onClose={() => setShowAddMedical(false)}
        petId={id}
        onSubmit={async (input) => {
          await createRecord.mutateAsync({ ...input, pet_id: id });
          setShowAddMedical(false);
        }}
      />

      {/* Modal adăugare greutate */}
      <AddWeightModal
        visible={showAddWeight}
        onClose={() => setShowAddWeight(false)}
        onSubmit={async (weight_kg, measured_at, notes) => {
          await addWeight.mutateAsync({ pet_id: id, weight_kg, measured_at, notes });
          setShowAddWeight(false);
        }}
      />
    </SafeAreaView>
  );
}

function AddMedicalModal({ visible, onClose, petId, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  petId: string;
  onSubmit: (input: { type: MedicalType; title: string; record_date: string; due_date: string | null; notes: string | null }) => Promise<void>;
}) {
  const t = useAppTheme();
  const [type, setType] = useState<MedicalType>('vaccinare');
  const [title, setTitle] = useState('');
  const [recordDate, setRecordDate] = useState(toDateInput());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) { Alert.alert('Lipsă', 'Titlul este obligatoriu'); return; }
    setBusy(true);
    try {
      await onSubmit({ type, title: title.trim(), record_date: recordDate, due_date: dueDate || null, notes: notes.trim() || null });
      setTitle(''); setNotes(''); setDueDate(''); setRecordDate(toDateInput());
    } catch (e: any) {
      Alert.alert('Eroare', e?.message ?? 'Încearcă din nou');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={{ margin: 16, maxHeight: '90%' }}>
          <ScrollView>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXl, fontFamily: t.typography.fontFamilyBold, marginBottom: t.spacing.md }}>
              Înregistrare medicală
            </Text>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm, fontFamily: t.typography.fontFamilyMedium, marginBottom: t.spacing.xs }}>Tip *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: t.spacing.md }}>
              {MEDICAL_TYPE_OPTIONS.map((tp) => (
                <Button key={tp} title={MEDICAL_TYPE_LABELS[tp]} size="sm" variant={type === tp ? 'primary' : 'outline'} onPress={() => setType(tp)} />
              ))}
            </View>
            <Input label="Titlu *" value={title} onChangeText={setTitle} placeholder="Vaccin rabie" />
            <Input label="Data eveniment (YYYY-MM-DD)" value={recordDate} onChangeText={setRecordDate} placeholder={toDateInput()} />
            <Input label="Scadență (opțional, YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="2027-10-26" />
            <Input label="Note" value={notes} onChangeText={setNotes} placeholder="Doza, veterinarul, reacții..." multiline numberOfLines={3} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: t.spacing.md }}>
              <Button title="Anulează" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Salvează" onPress={submit} loading={busy} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}

function AddWeightModal({ visible, onClose, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (weight_kg: number, measured_at: string, notes: string | null) => Promise<void>;
}) {
  const t = useAppTheme();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(toDateInput());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const w = parseFloat(weight.replace(',', '.'));
    if (!w || w <= 0) { Alert.alert('Greutate invalidă', 'Introdu o valoare validă în kg'); return; }
    setBusy(true);
    try {
      await onSubmit(w, date, notes.trim() || null);
      setWeight(''); setNotes(''); setDate(toDateInput());
    } catch (e: any) {
      Alert.alert('Eroare', e?.message ?? 'Încearcă din nou');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={{ margin: 16 }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXl, fontFamily: t.typography.fontFamilyBold, marginBottom: t.spacing.md }}>
            Cântărire
          </Text>
          <Input label="Greutate (kg) *" value={weight} onChangeText={setWeight} placeholder="12.5" keyboardType="decimal-pad" />
          <Input label="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder={toDateInput()} />
          <Input label="Note" value={notes} onChangeText={setNotes} placeholder="La veterinar, dimineața..." multiline numberOfLines={2} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: t.spacing.md }}>
            <Button title="Anulează" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Salvează" onPress={submit} loading={busy} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  photoPlaceholder: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  weightIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  pedigreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', flex: 1 },
  ougInfoBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
});
