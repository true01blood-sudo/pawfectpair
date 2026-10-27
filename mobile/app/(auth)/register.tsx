/**
 * Ecran Înregistrare — email + parolă cu confirmări GDPR (vârstă, termeni).
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { RegisterSchema, type RegisterForm } from '@pawfectpair/shared';

export default function RegisterScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    email: '', password: '', confirmPassword: '', full_name: '',
    age_consent: false as any, terms_consent: false as any,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setErrors({});
    const parsed = RegisterSchema.safeParse(form);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) if (i.path[0]) m[String(i.path[0])] = i.message;
      setErrors(m);
      return;
    }
    setBusy(true);
    try {
      await signUpWithEmail(parsed.data);
      Alert.alert('Cont creat', 'Verifică emailul pentru a confirma contul, apoi te poți conecta.');
      router.replace('/(auth)/login');
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
            <Text style={{ fontSize: 56 }}>🐾</Text>
            <Text style={{ color: t.colors.text, fontSize: 24, fontWeight: 'bold' }}>Creează cont</Text>
            <Text style={{ color: t.colors.textMuted, textAlign: 'center' }}>
              Alătură-te comunității PawfectPair
            </Text>
          </View>

          <Card>
            <Input label="Nume complet *" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} error={errors.full_name} placeholder="Ion Popa" />
            <Input label="Email *" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} error={errors.email} placeholder="ion@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Parolă *" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} error={errors.password} placeholder="minim 8 caractere" secureTextEntry helper="Minim 8 caractere, cel puțin o literă și o cifră" />
            <Input label="Confirmă parola *" value={form.confirmPassword} onChangeText={(v) => setForm({ ...form, confirmPassword: v })} error={errors.confirmPassword} placeholder="••••••••" secureTextEntry />

            {/* GDPR consimțăminte */}
            <View style={[styles.consent, { backgroundColor: t.colors.surfaceAlt, borderColor: errors.age_consent ? t.colors.danger : t.colors.border }]}>
              <Pressable onPress={() => setForm({ ...form, age_consent: !form.age_consent as any })} style={styles.checkboxRow}>
                <View style={[styles.checkbox, form.age_consent && { backgroundColor: t.colors.primary, borderColor: t.colors.primary }]}>
                  {form.age_consent && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={{ color: t.colors.text, flex: 1, fontSize: t.typography.fontSizeSm }}>
                  Confirm că am cel puțin 16 ani *
                </Text>
              </Pressable>
              {errors.age_consent && <Text style={{ color: t.colors.danger, fontSize: 11, marginTop: 4 }}>{errors.age_consent}</Text>}
            </View>

            <View style={[styles.consent, { backgroundColor: t.colors.surfaceAlt, borderColor: errors.terms_consent ? t.colors.danger : t.colors.border, marginTop: t.spacing.sm }]}>
              <Pressable onPress={() => setForm({ ...form, terms_consent: !form.terms_consent as any })} style={styles.checkboxRow}>
                <View style={[styles.checkbox, form.terms_consent && { backgroundColor: t.colors.primary, borderColor: t.colors.primary }]}>
                  {form.terms_consent && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={{ color: t.colors.text, flex: 1, fontSize: t.typography.fontSizeSm }}>
                  Am citit și accept <Text style={{ color: t.colors.primary }} onPress={() => Linking.openURL('https://pawfectpair.app/legal/termeni')}>Termenii</Text> și <Text style={{ color: t.colors.primary }} onPress={() => Linking.openURL('https://pawfectpair.app/legal/confidentialitate')}>Politica de confidențialitate</Text> *
                </Text>
              </Pressable>
              {errors.terms_consent && <Text style={{ color: t.colors.danger, fontSize: 11, marginTop: 4 }}>{errors.terms_consent}</Text>}
            </View>

            <Button title="Creează cont" onPress={handleSubmit} loading={busy} fullWidth size="lg" style={{ marginTop: t.spacing.lg }} />
          </Card>

          <View style={styles.footer}>
            <Text style={{ color: t.colors.textMuted }}>Ai deja cont?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: t.colors.primary, marginLeft: 4, fontWeight: '600' }}>Conectează-te</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  consent: { borderWidth: 1.5, borderRadius: 10, padding: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
});
