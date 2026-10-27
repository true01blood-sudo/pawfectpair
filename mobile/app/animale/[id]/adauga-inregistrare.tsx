/**
 * Adaugă înregistrare medicală pentru un animal.
 * Tipuri: vaccination, treatment, checkup, surgery, allergy, other.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../components/theme-provider';
import { useCreateMedicalRecord } from '../../../hooks';

type RecordType = 'vaccination' | 'treatment' | 'checkup' | 'surgery' | 'allergy' | 'other';

const TYPES: { value: RecordType; icon: string; label: string }[] = [
  { value: 'vaccination', icon: '💉', label: 'Vaccinare' },
  { value: 'treatment', icon: '💊', label: 'Tratament' },
  { value: 'checkup', icon: '🩺', label: 'Control' },
  { value: 'surgery', icon: '🔪', label: 'Operație' },
  { value: 'allergy', icon: '⚠️', label: 'Alergie' },
  { value: 'other', icon: '📋', label: 'Altele' },
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AdaugaInregistrareScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const createRecord = useCreateMedicalRecord();

  const [type, setType] = useState<RecordType>('vaccination');
  const [title, setTitle] = useState('');
  const [recordDate, setRecordDate] = useState(todayStr());
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Eroare', 'Titlul este obligatoriu.');
      return;
    }
    try {
      await createRecord.mutateAsync({
        pet_id: id,
        type,
        title: title.trim(),
        record_date: recordDate,
        next_due_date: nextDueDate || undefined,
        notes: notes.trim() || undefined,
      } as any);
      router.back();
    } catch (e: any) {
      Alert.alert('Eroare', e.message ?? 'Nu s-a putut salva înregistrarea.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Adaugă înregistrare' }} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Tip selector */}
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Tip înregistrare</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => {
            const active = type === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: active
                      ? theme.colors.primary + '18'
                      : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{t.icon}</Text>
                <Text style={{
                  fontSize: 11, fontWeight: '600', marginTop: 4,
                  color: active ? theme.colors.primary : theme.colors.text,
                }}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Titlu */}
        <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: 20 }]}>Titlu *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={type === 'vaccination' ? 'ex: Vaccinare antirabică anuală' : 'ex: Tratament purici și căpușe'}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
        />

        {/* Data efectuării */}
        <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: 16 }]}>Data efectuării *</Text>
        <TextInput
          value={recordDate}
          onChangeText={setRecordDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
        />

        {/* Scadență */}
        <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: 16 }]}>Scadență / Repetare</Text>
        <TextInput
          value={nextDueDate}
          onChangeText={setNextDueDate}
          placeholder="YYYY-MM-DD (opțional)"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
        />

        {/* Note */}
        <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: 16 }]}>Note</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Informații suplimentare, doze, medicamente..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={3}
          style={[styles.textArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
        />
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Pressable
          onPress={handleSave}
          disabled={createRecord.isPending}
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary, opacity: createRecord.isPending ? 0.6 : 1 }]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {createRecord.isPending ? 'Se salvează...' : 'Salvează înregistrarea'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    width: '30%', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
  },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14, minHeight: 90, textAlignVertical: 'top',
  },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14,
  },
});
