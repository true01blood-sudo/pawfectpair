/**
 * Ecran Istoric Greutate — chart + listă + buton adăugare.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAppTheme } from '../../../components/theme-provider';
import { Button, Card, StateView, Input } from '../../../components/ui';
import { WeightChart } from '../../../components/medical';
import { useWeightLogs, useAddWeightLog } from '../../../hooks';
import { formatDateRO, toDateInput } from '@pawfectpair/shared';

export default function GreutateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useAppTheme();
  const weight = useWeightLogs(id);
  const add = useAddWeightLog();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Evoluție greutate' }} />
      <FlatList
        data={[...(weight.data ?? [])].reverse()}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={{ padding: t.spacing.lg }}>
            <WeightChart logs={weight.data ?? []} />
            <View style={[styles.row, { justifyContent: 'space-between', marginTop: t.spacing.lg, marginBottom: t.spacing.sm }]}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold }}>
                Istoric cântăriri
              </Text>
              <Button title="+ Adaugă" size="sm" onPress={() => setShowAdd(true)} />
            </View>
            <StateView
              loading={weight.isLoading}
              error={weight.error?.message}
              empty={weight.data?.length === 0}
              emptyText="Nicio cântărire înregistrată încă."
            >
              <></>
            </StateView>
          </View>
        )}
        renderItem={({ item }) => (
          <Card style={{ marginHorizontal: t.spacing.lg, marginBottom: t.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.icon, { backgroundColor: t.colors.primaryLight }]}>
              <Text style={{ fontSize: 20 }}>⚖️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold }}>
                {item.weight_kg} kg
              </Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm }}>
                {formatDateRO(item.measured_at)}
              </Text>
              {item.notes && (
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs, marginTop: 4 }} numberOfLines={2}>
                  {item.notes}
                </Text>
              )}
            </View>
          </Card>
        )}
        ListFooterComponent={() => <View style={{ height: t.spacing.xxl }} />}
        contentContainerStyle={{ paddingBottom: t.spacing.lg , maxWidth: 720, width: '100%', alignSelf: 'center' }}
      />

      <AddWeightModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={async (w, d, n) => {
          await add.mutateAsync({ pet_id: id, weight_kg: w, measured_at: d, notes: n });
          setShowAdd(false);
        }}
      />
    </SafeAreaView>
  );
}

function AddWeightModal({ visible, onClose, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (w: number, d: string, n: string | null) => Promise<void>;
}) {
  const t = useAppTheme();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(toDateInput());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const w = parseFloat(weight.replace(',', '.'));
    if (!w || w <= 0) { Alert.alert('Invalid', 'Greutate invalidă'); return; }
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
      <View style={styles.overlay}>
        <Card style={{ margin: 16 }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXl, fontFamily: t.typography.fontFamilyBold, marginBottom: t.spacing.md }}>
            Cântărire nouă
          </Text>
          <Input label="Greutate (kg) *" value={weight} onChangeText={setWeight} placeholder="12.5" keyboardType="decimal-pad" />
          <Input label="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder={toDateInput()} />
          <Input label="Note" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
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
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
});
