/**
 * Tab Animalele mele — My Pets hub: lista animale, acces rapid la dosar/pedigree/passport.
 * Structură: header cu buton adaugă → lista animale → setări profil.
 */
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { usePets } from '../../hooks/usePets';

export default function AnimaleMeleScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { pets, loading } = usePets();

  const handleAddPet = useCallback(() => {
    router.push('/animale/new' as any);
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Header */}
        <View style={[styles.headerRow, { paddingHorizontal: theme.spacing.lg, paddingTop: 16 }]}>
          <View>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSize2xl, fontFamily: theme.typography.fontFamilyBold }}>
              {t('myPets.title', 'Animalele mele')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: 2 }}>
              {t('myPets.subtitle', 'Profiluri, dosare și pașapoarte')}
            </Text>
          </View>
          <Pressable
            onPress={handleAddPet}
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Lista animale */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : pets && pets.length > 0 ? (
            pets.map((pet: any) => (
              <Pressable
                key={pet.id}
                onPress={() => router.push(`/animale/${pet.id}` as any)}
                style={[styles.petCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.avatarImg} />
                  ) : (
                    <Text style={{ fontSize: 28 }}>🐾</Text>
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontWeight: '700' }}>
                    {pet.name}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, marginTop: 2 }}>
                    {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                  </Text>
                </View>

                {/* Shortcut-uri rapide */}
                <View style={styles.quickActions}>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); router.push(`/animale/${pet.id}` as any); }}
                    style={[styles.quickBtn, { backgroundColor: theme.colors.background }]}
                    hitSlop={8}
                  >
                    <Ionicons name="medkit" size={16} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); router.push(`/animale/${pet.id}/pedigree` as any); }}
                    style={[styles.quickBtn, { backgroundColor: theme.colors.background }]}
                    hitSlop={8}
                  >
                    <Ionicons name="git-network" size={16} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); router.push(`/animale/${pet.id}/passport` as any); }}
                    style={[styles.quickBtn, { backgroundColor: theme.colors.background }]}
                    hitSlop={8}
                  >
                    <Ionicons name="airplane" size={16} color={theme.colors.primary} />
                  </Pressable>
                </View>

                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} style={{ marginLeft: 4 }} />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🐾</Text>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontWeight: '700', marginBottom: 6 }}>
                {t('myPets.empty', 'Nu ai animale înregistrate')}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, textAlign: 'center', marginBottom: 20 }}>
                {t('myPets.emptyDesc', 'Adaugă primul tău animal pentru a accesa toate funcțiile platformei')}
              </Text>
              <Pressable
                onPress={handleAddPet}
                style={[styles.emptyAddBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: theme.typography.fontSizeSm }}>
                  {t('myPets.addFirst', 'Adaugă animal')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Setări profil utilizator */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, fontWeight: '700', letterSpacing: 1, marginBottom: theme.spacing.sm, textTransform: 'uppercase' }}>
            {t('myPets.account', 'Cont')}
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/profil')}
            style={[styles.settingsRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Ionicons name="person-circle" size={22} color={theme.colors.primary} />
            <Text style={{ flex: 1, color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontWeight: '600' }}>
              {t('myPets.profileSettings', 'Profil și setări')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/modul/petpassport' as any)}
            style={[styles.settingsRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 8 }]}
          >
            <Ionicons name="airplane" size={22} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontWeight: '600' }}>
                {t('myPets.petpassport', 'Pașaport & travel')}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                {t('myPets.petpassportDesc', 'Documente pentru călătorii')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  petCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 52, height: 52 },
  quickActions: { flexDirection: 'row', gap: 6 },
  quickBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center', paddingTop: 40, paddingBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
});
