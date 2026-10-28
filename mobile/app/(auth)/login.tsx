/**
 * Ecran Login — email + parolă și OAuth (Google, Facebook, Apple).
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
            <Button title="Apple" variant="outline" onPress={() => handleOAuth('apple')} leftIcon={<Svg width={18} height={18} viewBox="0 0 814 1000"><Path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-150.9-110c-43.7-64.7-67.2-168.1-67.2-266.6 0-176.3 114.5-269 227.1-269 59.2 0 108.2 39.5 145.5 39.5 35.8 0 91.3-41.3 158-41.3 25.2 0 108.2 2.6 168.9 81zm-56.9-191.7c-28.5 34.2-78 60.2-118.8 60.2-5.2 0-10.3-.6-15.5-1.3C601 171 647 94.3 647 48.6c0-2.6 0-5.2-.6-7.8C599.5 42.5 549.5 77.4 520.3 113.3c-27.3 33-46.8 82.6-46.8 128.4 0 6.5 1.3 12.9 1.9 15.5 3.2.6 8.4 1.3 13.6 1.3 44.2 0 92.3-32.4 117.9-64.7z" fill="currentColor"/></Svg>} style={{ flex: 1 }} />
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
