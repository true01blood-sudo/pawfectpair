/**
 * Flux de rezervare în 3 pași — Animal → Oră → Recapitulare.
 * Scrie o programare reală în vet_appointments. Oglindește
 * BookingWizard.tsx de pe web.
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
import { useVetDetail, useVetServicesFull, useBookVetAppointment } from '../../../hooks/useVetDetail';
import { useMyPets } from '../../../hooks';

type Step = 'pet' | 'time' | 'review';
const STEPS: Step[] = ['pet', 'time', 'review'];
const STEP_LABELS: Record<Step, string> = { pet: 'Animal', time: 'Oră', review: 'Recapitulare' };

export default function VetBookingScreen() {
  const { id, serviciu } = useLocalSearchParams<{ id: string; serviciu?: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;
  const sp = theme.spacing;

  const vetQ = useVetDetail(id);
  const servicesQ = useVetServicesFull(id);
  const myPets = useMyPets();
  const bookMutation = useBookVetAppointment();

  const [step, setStep] = useState<Step>('pet');
  const [petId, setPetId] = useState('');
  const [serviceId, setServiceId] = useState(serviciu ?? '');
  const [date, setDate] = useState(toDateInput());
  const [time, setTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);

  const pets = myPets.data ?? [];
  const services = servicesQ.data ?? [];
  const selectedPet = pets.find((p) => p.id === petId) ?? null;
  const selectedService = services.find((sv) => sv.id === serviceId) ?? null;
  const stepIndex = STEPS.indexOf(step);

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const timeOk = /^\d{2}:\d{2}$/.test(time);
  const startsAtIso = useMemo(() => {
    if (!dateOk || !timeOk) return null;
    const d = new Date(`${date}T${time}:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }, [date, time, dateOk, timeOk]);

  function goNext() {
    if (step === 'pet' && !petId) return;
    if (step === 'time' && !startsAtIso) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }
  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function handleConfirm() {
    if (!startsAtIso || !petId || !id) return;
    bookMutation.mutate(
      {
        vet_id: id,
        pet_id: petId,
        starts_at: startsAtIso,
        reason: reason.trim() || null,
        service_id: serviceId || null,
      },
      {
        onSuccess: () => setDone(true),
        onError: (e: Error) => Alert.alert('Nu am putut programa vizita', e.message || 'Încearcă din nou.'),
      }
    );
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Confirmat', headerLeft: () => null }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: sp.xl, gap: sp.md }}>
          <Text style={{ fontSize: 56 }}>✅</Text>
          <Text style={{ color: s.text, fontSize: 18, fontFamily: theme.typography.fontFamilyBold, textAlign: 'center' }}>
            Programare confirmată!
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 14, textAlign: 'center' }}>
            {vetQ.data?.clinic_name} te așteaptă pe {selectedPet?.name} pe {new Date(startsAtIso!).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.
          </Text>
          <Button title="Înapoi la cabinet" onPress={() => router.replace(`/veterinari/${id}` as any)} style={{ marginTop: sp.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: vetQ.data?.clinic_name ?? 'Programare' }} />
      <ScrollView contentContainerStyle={{ padding: sp.lg, paddingBottom: sp.xxl }} keyboardShouldPersistTaps="handled">
        {/* Step indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: sp.lg, gap: 6 }}>
          {STEPS.map((st, i) => (
            <React.Fragment key={st}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: i < stepIndex ? '#16a34a' : i === stepIndex ? s.primary : s.surface,
                      borderColor: i > stepIndex ? s.border : 'transparent',
                      borderWidth: i > stepIndex ? 1 : 0,
                    },
                  ]}
                >
                  <Text style={{ color: i <= stepIndex ? '#fff' : s.textMuted, fontSize: 13, fontFamily: theme.typography.fontFamilyBold }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: i <= stepIndex ? s.text : s.textMuted, fontFamily: theme.typography.fontFamilyMedium }}>
                  {STEP_LABELS[st]}
                </Text>
              </View>
              {i < STEPS.length - 1 && <View style={{ height: 1.5, width: 28, backgroundColor: i < stepIndex ? '#16a34a' : s.border }} />}
            </React.Fragment>
          ))}
        </View>

        {step === 'pet' && (
          <View style={{ gap: sp.sm }}>
            <Text style={{ color: s.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold }}>Alege animalul</Text>
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

            {services.length > 0 && (
              <View style={{ marginTop: sp.md }}>
                <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold, marginBottom: 8 }}>
                  Serviciu (opțional)
                </Text>
                {services.map((srv) => (
                  <Pressable
                    key={srv.id}
                    onPress={() => setServiceId(serviceId === srv.id ? '' : srv.id)}
                    style={[styles.optionRow, { borderColor: serviceId === srv.id ? s.primary : s.border, backgroundColor: serviceId === srv.id ? `${s.primary}10` : s.surface, marginTop: 6 }]}
                  >
                    <Text style={{ color: s.text, fontSize: 13, flex: 1 }}>{srv.name}</Text>
                    <Text style={{ color: s.primary, fontSize: 13, fontFamily: theme.typography.fontFamilyBold }}>
                      {(srv.price_cents / 100).toFixed(0)} {srv.currency}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Button title="Continuă" onPress={goNext} disabled={!petId} style={{ marginTop: sp.md }} />
          </View>
        )}

        {step === 'time' && (
          <View style={{ gap: sp.sm }}>
            <Text style={{ color: s.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold }}>Alege data și ora</Text>
            <Input label="Data (AAAA-LL-ZZ)" placeholder={toDateInput()} value={date} onChangeText={setDate} maxLength={10} keyboardType="numbers-and-punctuation" />
            <Input label="Ora (OO:MM)" placeholder="10:00" value={time} onChangeText={setTime} maxLength={5} keyboardType="numbers-and-punctuation" />
            <Input label="Motivul vizitei (opțional)" placeholder="Ex. control de rutină" value={reason} onChangeText={setReason} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: sp.sm }}>
              <Button title="Înapoi" variant="outline" onPress={goBack} style={{ flex: 1 }} />
              <Button title="Continuă" onPress={goNext} disabled={!startsAtIso} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {step === 'review' && (
          <View style={{ gap: sp.sm }}>
            <Text style={{ color: s.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold, marginBottom: 4 }}>Recapitulare</Text>

            <View style={[styles.reviewCard, { backgroundColor: s.surface, borderColor: s.border }]}>
              {selectedPet?.photo_url ? (
                <Image source={{ uri: selectedPet.photo_url }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
              ) : (
                <View style={[styles.petFallback, { backgroundColor: s.surfaceAlt }]}>
                  <Ionicons name="paw" size={18} color={s.primary} />
                </View>
              )}
              <View>
                <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>{selectedPet?.name}</Text>
                <Text style={{ color: s.textMuted, fontSize: 12 }}>
                  {vetQ.data?.clinic_name}{selectedService ? ` · ${selectedService.name}` : ''}
                </Text>
              </View>
            </View>

            <View style={[styles.reviewCard, { backgroundColor: s.surface, borderColor: s.border }]}>
              <Ionicons name="calendar" size={20} color={s.primary} />
              <View>
                <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>
                  {startsAtIso ? new Date(startsAtIso).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
                {reason && <Text style={{ color: s.textMuted, fontSize: 12 }}>{reason}</Text>}
              </View>
            </View>

            {selectedService && (
              <View style={[styles.sectionCard, { backgroundColor: s.surface, borderColor: s.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: s.textMuted, fontSize: 13 }}>Serviciu</Text>
                  <Text style={{ color: s.text, fontSize: 13 }}>{selectedService.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilyBold }}>Total</Text>
                  <Text style={{ color: s.primary, fontSize: 14, fontFamily: theme.typography.fontFamilyBold }}>
                    {(selectedService.price_cents / 100).toFixed(0)} {selectedService.currency}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: sp.sm }}>
              <Button title="Înapoi" variant="outline" onPress={goBack} style={{ flex: 1 }} />
              <Button title="Confirmă programarea" onPress={handleConfirm} loading={bookMutation.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, padding: 10 },
  petFallback: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  sectionCard: { borderRadius: 14, borderWidth: 1, padding: 12 },
});
