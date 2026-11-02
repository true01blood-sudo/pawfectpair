/**
 * Cerere de sesiune cu trainerul — scrie o rezervare reală în
 * trainer_bookings (status inițial „requested", la fel ca
 * vet_appointments — trainerul confirmă ulterior).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { toDateInput } from '@pawfectpair/shared';
import { useAppTheme } from '../../../components/theme-provider';
import { Button, Input } from '../../../components/ui';
import { useTrainerDetail, useRequestTrainerBooking } from '../../../hooks/useVetDetail';
import { useMyPets } from '../../../hooks';

export default function TrainerBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;
  const sp = theme.spacing;

  const trainerQ = useTrainerDetail(id);
  const myPets = useMyPets();
  const requestMutation = useRequestTrainerBooking();

  const [petId, setPetId] = useState('');
  const [date, setDate] = useState(toDateInput());
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  const pets = myPets.data ?? [];
  const selectedPet = pets.find((p) => p.id === petId) ?? null;

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const timeOk = /^\d{2}:\d{2}$/.test(time);
  const requestedAtIso = useMemo(() => {
    if (!dateOk || !timeOk) return null;
    const d = new Date(`${date}T${time}:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }, [date, time, dateOk, timeOk]);

  const canSubmit = !!petId && !!requestedAtIso && !!id;

  function handleConfirm() {
    if (!canSubmit) return;
    requestMutation.mutate(
      { trainer_id: id!, pet_id: petId, requested_at: requestedAtIso!, notes: notes.trim() || null },
      {
        onSuccess: () => setDone(true),
        onError: (e: Error) => Alert.alert('Nu am putut trimite cererea', e.message || 'Încearcă din nou.'),
      }
    );
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Trimis', headerLeft: () => null }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: sp.xl, gap: sp.md }}>
          <Text style={{ fontSize: 56 }}>📨</Text>
          <Text style={{ color: s.text, fontSize: 18, fontFamily: theme.typography.fontFamilyBold, textAlign: 'center' }}>
            Cerere trimisă!
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 14, textAlign: 'center' }}>
            {trainerQ.data?.display_name} va confirma sesiunea cu {selectedPet?.name} în curând.
          </Text>
          <Button title="Înapoi la profil" onPress={() => router.replace(`/antrenori/${id}` as any)} style={{ marginTop: sp.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: trainerQ.data?.display_name ?? 'Cerere sesiune' }} />
      <ScrollView contentContainerStyle={{ padding: sp.lg, paddingBottom: sp.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: s.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold }}>Alege animalul</Text>
        <View style={{ gap: 8, marginTop: sp.sm }}>
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => setPetId(pet.id)}
              style={[styles.optionRow, { borderColor: petId === pet.id ? s.primary : s.border, backgroundColor: petId === pet.id ? `${s.primary}10` : s.surface }]}
            >
              {pet.photo_url ? (
                <Image source={{ uri: pet.photo_url }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
              ) : (
                <View style={[styles.petFallback, { backgroundColor: s.surfaceAlt }]}>
                  <Ionicons name="paw" size={18} color={s.primary} />
                </View>
              )}
              <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold, flex: 1 }}>{pet.name}</Text>
              {petId === pet.id && <Ionicons name="checkmark-circle" size={20} color={s.primary} />}
            </Pressable>
          ))}
          {pets.length === 0 && (
            <Text style={{ color: s.textMuted, fontSize: 13 }}>
              Nu ai încă niciun animal adăugat. Adaugă unul din Animalele mele.
            </Text>
          )}
        </View>

        <Text style={{ color: s.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold, marginTop: sp.lg }}>
          Data și ora dorite
        </Text>
        <View style={{ marginTop: sp.sm }}>
          <Input label="Data (AAAA-LL-ZZ)" placeholder={toDateInput()} value={date} onChangeText={setDate} maxLength={10} keyboardType="numbers-and-punctuation" />
          <Input label="Ora (OO:MM)" placeholder="10:00" value={time} onChangeText={setTime} maxLength={5} keyboardType="numbers-and-punctuation" />
          <Input label="Detalii pentru trainer (opțional)" placeholder="Ex. comportament, vârsta animalului..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} />
        </View>

        <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 4 }}>
          Trimiți o cerere — {trainerQ.data?.display_name ?? 'trainerul'} o confirmă manual.
        </Text>

        <Button
          title="Trimite cererea"
          onPress={handleConfirm}
          disabled={!canSubmit}
          loading={requestMutation.isPending}
          style={{ marginTop: sp.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, padding: 10 },
  petFallback: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
