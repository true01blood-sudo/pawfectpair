/**
 * Ecran Profil — date utilizator, setări temă, buton logout, GDPR.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Avatar, Button, Card, Input } from '../../components/ui';
import { useProfile, useUpdateProfile, useAuth } from '../../hooks';
import { useUIStore } from '../../store/ui.store';
import { pickFromGallery, takePhoto, PhotoValidationError } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';
import { ProfileSchema } from '@pawfectpair/shared';
import { LANGUAGE_LABELS, type AppLanguage } from '../../lib/i18n';

export default function ProfilScreen() {
  const t = useTranslation().t;
  const { i18n } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { profile, updateProfile } = { profile: useProfile(), updateProfile: useUpdateProfile() };
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);
  const themePreference = useUIStore((s) => s.themePreference);
  const setThemePreference = useUIStore((s) => s.setThemePreference);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.data?.full_name ?? '');
  const [phone, setPhone] = useState(profile.data?.phone ?? '');
  const [bio, setBio] = useState(profile.data?.bio ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? '');
      setPhone(profile.data.phone ?? '');
      setBio(profile.data.bio ?? '');
    }
  }, [profile.data]);

  async function changePhoto(mode: 'gallery' | 'camera') {
    if (!user) return;
    try {
      setUploading(true);
      const picked = mode === 'gallery' ? await pickFromGallery() : await takePhoto();
      if (!picked) return;
      const url = await uploadPetPhoto(picked.uri, user.id, picked.ext);
      await updateProfile.mutateAsync({ avatar_url: url });
    } catch (e) {
      const msg = e instanceof PhotoValidationError ? e.message : 'Eroare la încărcare';
      Alert.alert('Imagine', msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setErrors({});
    const parsed = ProfileSchema.safeParse({ full_name: fullName, phone: phone || null, bio: bio || null });
    if (!parsed.success) {
      const m: Record<string, string> = {};
      for (const i of parsed.error.issues) if (i.path[0]) m[String(i.path[0])] = i.message;
      setErrors(m);
      return;
    }
    try {
      await updateProfile.mutateAsync({ full_name: parsed.data.full_name ?? null, phone: parsed.data.phone ?? null, bio: parsed.data.bio ?? null });
      setEditing(false);
      Alert.alert('Salvat', 'Profilul a fost actualizat.');
    } catch (e: any) {
      Alert.alert('Eroare', e?.message ?? 'Încearcă din nou');
    }
  }

  function handleLogout() {
    Alert.alert(t('auth.logout'), 'Sigur vrei să te deconectezi?', [
      { text: t('app.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [{ text: 'Deschide email', onPress: () => Linking.openURL('mailto:support@petcare.app?subject=Solicitare ștergere cont') }, { text: t('app.close') }]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* Header profil */}
        <Card elevated="md" style={{ alignItems: 'center' }}>
          <View style={{ position: 'relative' }}>
            {profile.data?.avatar_url ? (
              <Image source={{ uri: profile.data.avatar_url }} style={{ width: 96, height: 96, borderRadius: 48 }} contentFit="cover" />
            ) : (
              <Avatar name={profile.data?.full_name} size={96} />
            )}
            {editing && (
              <View style={styles.photoActions}>
                <Button title="📷" size="sm" variant="outline" onPress={() => changePhoto('camera')} loading={uploading} />
                <Button title="🖼️" size="sm" variant="outline" onPress={() => changePhoto('gallery')} loading={uploading} />
              </View>
            )}
          </View>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXl, fontFamily: theme.typography.fontFamilyBold, marginTop: theme.spacing.md }}>
            {profile.data?.full_name ?? 'Proprietar'}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>{profile.data?.email ?? user?.email}</Text>
          {profile.data?.phone && (
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>{profile.data.phone}</Text>
          )}
          {profile.data?.bio && (
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, textAlign: 'center', marginTop: theme.spacing.sm }}>
              {profile.data.bio}
            </Text>
          )}
          <Button
            title={editing ? t('profile.cancelEdit') : t('profile.editProfile')}
            variant={editing ? 'ghost' : 'outline'}
            onPress={() => setEditing(!editing)}
            style={{ marginTop: theme.spacing.md }}
          />
        </Card>

        {/* Form editare */}
        {editing && (
          <Card>
            <Input label={t('profile.name')} value={fullName} onChangeText={setFullName} error={errors.full_name} />
            <Input label={t('profile.phone')} value={phone} onChangeText={setPhone} error={errors.phone} placeholder="+40712345678" keyboardType="phone-pad" />
            <Input label={t('profile.bio')} value={bio} onChangeText={setBio} error={errors.bio} placeholder={t('profile.bioPlaceholder')} multiline numberOfLines={3} />
            <Button title={t('profile.save')} onPress={handleSave} loading={updateProfile.isPending} fullWidth size="lg" />
          </Card>
        )}

        {/* Setări temă */}
        <Card>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.md }}>
            🎨 {t('profile.appearance')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text }}>{t('profile.darkMode')}</Text>
            <Switch
              value={themePreference === 'dark'}
              onValueChange={(v) => setThemePreference(v ? 'dark' : 'light')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm }}>
            <Button title={t('profile.light')} size="sm" variant={themePreference === 'light' ? 'primary' : 'outline'} onPress={() => setThemePreference('light')} style={{ flex: 1 }} />
            <Button title={t('profile.dark')} size="sm" variant={themePreference === 'dark' ? 'primary' : 'outline'} onPress={() => setThemePreference('dark')} style={{ flex: 1 }} />
            <Button title={t('profile.system')} size="sm" variant={themePreference === 'system' ? 'primary' : 'outline'} onPress={() => setThemePreference('system')} style={{ flex: 1 }} />
          </View>
        </Card>

        {/* Limbă & regiune */}
        <Card>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.md }}>
            🌍 {t('profile.language')}
          </Text>
          <Pressable onPress={() => router.push('/setari/limba')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View>
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontWeight: '600' }}>
                  {LANGUAGE_LABELS[i18n.language as AppLanguage]?.flag} {LANGUAGE_LABELS[i18n.language as AppLanguage]?.native}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
                  {t('profile.languageDesc')}
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 22 }}>›</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://pawfectpair.app')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 4 }}>
              <View>
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontWeight: '600' }}>
                  🌐 pawfectpair.app
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
                  Site-ul complet — în browser
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 22 }}>›</Text>
            </View>
          </Pressable>
        </Card>

        {/* Linkuri legale */}
        <Card>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.md }}>
            {t('profile.legal')}
          </Text>
          <Pressable onPress={() => Linking.openURL('https://pawfectpair.app/legal/confidentialitate')}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>{t('profile.privacyPolicy')}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://pawfectpair.app/legal/termeni')}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>{t('profile.terms')}</Text>
          </Pressable>
          <Pressable onPress={handleDeleteAccount}>
            <Text style={[styles.link, { color: theme.colors.danger }]}>{t('profile.deleteAccount')}</Text>
          </Pressable>
        </Card>

        <Button title={t('auth.logout')} variant="danger" onPress={handleLogout} fullWidth size="lg" />
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: theme.typography.fontSizeXs }}>
          {t('profile.version')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photoActions: { position: 'absolute', bottom: -10, flexDirection: 'row', gap: 6 },
  link: { fontSize: 14, paddingVertical: 8, fontWeight: '500' },
});
