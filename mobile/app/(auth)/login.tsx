/**
 * Ecran Login — email + parolă și OAuth (Google, Facebook, Apple).
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../hooks/useAuth';
import { LoginSchema, type LoginForm } from '@pawfectpair/shared';

export default function LoginScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();
  const { signInWithEmail, signInWithOAuth } = useAuth();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setErrors({});
    const parsed = LoginSchema.safeParse(form);
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) if (i.path[0]) m[String(i.path[0])] = i.message;
      setErrors(m);
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(parsed.data);
    } catch (e: any) {
      Alert.alert(t('auth.loginFailed'), e?.message ?? t('app.retry'));
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'facebook' | 'apple') {
    try {
      await signInWithOAuth(provider);
    } catch (e: any) {
      Alert.alert('Eroare OAuth', e?.message ?? t('app.retry'));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing.lg, justifyContent: 'center' }}>
          <View style={styles.header}>
            <Logo size={100} showText={false} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Pet Care Services</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>

          <Card>
            <Input
              label={t('auth.email')}
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              error={errors.email}
              placeholder="ion@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label={t('auth.password')}
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              error={errors.password}
              placeholder="••••••••"
              secureTextEntry
            />
            <Pressable onPress={() => router.push('/(auth)/reset-password')}>
              <Text style={[styles.link, { color: theme.colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </Pressable>

            <Button title={t('auth.login')} onPress={handleSubmit} loading={busy} fullWidth size="lg" style={{ marginTop: theme.spacing.md }} />
          </Card>

          <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
            <Text style={{ color: theme.colors.textMuted }}>{t('auth.orContinueWith')}</Text>
          </View>

          <View style={styles.oauthRow}>
            <Button title="Google" variant="outline" onPress={() => handleOAuth('google')} leftIcon={<Text style={{ fontSize: 18 }}>G</Text>} style={{ flex: 1 }} />
            <Button title="Facebook" variant="outline" onPress={() => handleOAuth('facebook')} leftIcon={<Text style={{ fontSize: 18 }}>f</Text>} style={{ flex: 1 }} />
            <Button title="Apple" variant="outline" onPress={() => handleOAuth('apple')} leftIcon={<Text style={{ fontSize: 18 }}>🍎</Text>} style={{ flex: 1 }} />
          </View>

          <View style={styles.footer}>
            <Text style={{ color: theme.colors.textMuted }}>{t('auth.noAccount')}</Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.link, { color: theme.colors.primary, marginLeft: 4 }]}>{t('auth.register')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 24, gap: 8 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 14, textAlign: 'center' },
  oauthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  link: { fontSize: 14, fontWeight: '600' },
});
