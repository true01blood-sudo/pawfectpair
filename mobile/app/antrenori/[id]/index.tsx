/**
 * Ecran detaliu trainer — profil real (edu_trainers), cu acțiuni reale
 * de contact (apel, share) și cerere de sesiune reală (trainer_bookings).
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { TRAINER_SPECIALTY_EMOJI } from '@pawfectpair/shared';
import { useAppTheme } from '../../../components/theme-provider';
import { StateView, Button } from '../../../components/ui';
import { useTrainerDetail } from '../../../hooks/useVetDetail';
import { useMyPets } from '../../../hooks';
import { useAuthStore } from '../../../store/auth.store';

export default function TrainerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;
  const sp = theme.spacing;

  const trainerQ = useTrainerDetail(id);
  const trainer = trainerQ.data;
  const user = useAuthStore((st) => st.user);
  const myPets = useMyPets();

  if (trainerQ.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
        <StateView loading />
      </SafeAreaView>
    );
  }

  if (!trainer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
        <StateView empty emoji="🎓" title="Trainer negăsit" description="Acest profil nu mai există sau a fost șters." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: trainer.display_name }} />
      <ScrollView contentContainerStyle={{ padding: sp.lg, paddingBottom: sp.xxl }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: sp.sm }}>
          {trainer.photo_url ? (
            <Image source={{ uri: trainer.photo_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: s.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="person" size={44} color={s.primary} />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Text style={{ color: s.text, fontSize: 20, fontFamily: theme.typography.fontFamilyBold }}>{trainer.display_name}</Text>
            {trainer.verified && <Ionicons name="checkmark-circle" size={18} color={s.primary} />}
          </View>
          {trainer.city && (
            <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 2 }}>📍 {trainer.city}</Text>
          )}
          <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 2 }}>
            {trainer.experience_years} {trainer.experience_years === 1 ? 'an' : 'ani'} experiență
          </Text>
          {trainer.price_range && (
            <Text style={{ color: s.primary, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginTop: 6 }}>
              {trainer.price_range}
            </Text>
          )}
        </View>

        {trainer.specialties.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: sp.md }}>
            {trainer.specialties.map((spec) => (
              <View key={spec} style={[styles.badge, { borderColor: s.border, backgroundColor: s.surface }]}>
                <Text style={{ fontSize: 13 }}>{TRAINER_SPECIALTY_EMOJI[spec] ?? '📌'}</Text>
                <Text style={{ color: s.text, fontSize: 12, fontFamily: theme.typography.fontFamilyMedium }}>{spec}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.sectionCard, { backgroundColor: s.surface, borderColor: s.border, marginTop: sp.lg }]}>
          <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold, marginBottom: 8 }}>
            Despre {trainer.display_name}
          </Text>
          <Text style={{ color: trainer.bio ? s.text : s.textMuted, fontSize: 14, lineHeight: 20 }}>
            {trainer.bio || 'Acest trainer nu a adăugat încă o descriere.'}
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: s.surface, borderColor: s.border, marginTop: sp.md }]}>
          <Text style={{ color: s.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 8 }}>
            Cere o sesiune
          </Text>
          {!user ? (
            <Text style={{ color: s.textMuted, fontSize: 13 }}>Autentifică-te pentru a cere o sesiune.</Text>
          ) : (myPets.data?.length ?? 0) === 0 ? (
            <Text style={{ color: s.textMuted, fontSize: 13 }}>
              Nu ai încă niciun animal adăugat. Adaugă unul din Animalele mele.
            </Text>
          ) : (
            <Button title="Alege animalul și ora →" onPress={() => router.push(`/antrenori/${id}/rezerva` as any)} />
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: sp.md }}>
          {trainer.phone && (
            <Button
              title="📞 Sună"
              variant="outline"
              onPress={() => Linking.openURL(`tel:${trainer.phone}`)}
              style={{ flex: 1 }}
            />
          )}
          <Button
            title="Distribuie"
            variant="outline"
            onPress={() =>
              Share.share({
                message: `${trainer.display_name} — trainer${trainer.city ? ` în ${trainer.city}` : ''} pe Pet Care.`,
              }).catch(() => {})
            }
            style={{ flex: 1 }}
          />
        </View>

        {!trainer.phone && (
          <Text style={{ color: s.textMuted, fontSize: 12, textAlign: 'center', marginTop: sp.sm }}>
            Acest trainer nu a adăugat încă un număr de contact.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 96, height: 96, borderRadius: 48 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
});
