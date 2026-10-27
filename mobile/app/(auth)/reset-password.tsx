/**
 * Ecran Resetare parolă — trimite email cu link de resetare.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { ResetPasswordSchema, type ResetPasswordForm } from '@pawfectpair/shared';

export default function ResetPasswordScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [form, setForm] = useState<ResetPasswordForm>({ email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setErrors({});
    const parsed = ResetPasswordSchema.safeParse(form);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) if (i.path[0]) m[String(i.path[0])] = i.message;
      setErrors(m);
      return;
    }
    setBusy(true);
    try {
      await resetPassword(parsed.data);
      Alert.alert('Email trimis', 'Verifică emailul pentru instrucțiuni de resetare a parolei.');
      router.back();
    } catch (e: any) {
      Alert.alert('Eroare', e?.message ?? 'Încearcă din nou');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: t.spacing.lg }}>
          <View style={{ alignItems: 'center', marginBottom: 16, gap: 6 }}>
            <Text style={{ fontSize: 48 }}>🔑</Text>
            <Text style={{ color: t.colors.text, fontSize: 22, fontWeight: 'bold' }}>Resetare parolă</Text>
            <Text style={{ color: t.colors.textMuted, textAlign: 'center' }}>
              Introdu adresa de email și îți vom trimite un link de resetare.
            </Text>
          </View>
          <Card>
            <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} error={errors.email} placeholder="ion@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Button title="Trimite link" onPress={handleSubmit} loading={busy} fullWidth size="lg" />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
