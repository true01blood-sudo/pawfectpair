/**
 * My Pets tab — pet profiles, quick access to health / passport / pedigree
 * Design: pawfectpair-design aesthetic, clean card list
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../../components/theme-provider';
import { useMyPets } from '../../hooks';

export default function AnimaleMeleScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const pets = useMyPets();

  const s = theme.colors;
  const sp = theme.spacing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: sp.xxl + 16 }} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: sp.lg, paddingTop: sp.sm }]}>
          <View>
            <Text style={{ color: s.text, fontSize: 24, fontFamily: theme.typography.fontFamilyBold }}>
              My Pets
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 14, marginTop: 2 }}>
              Profiles, health records & passports
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/animale/nou')}
            style={[styles.addBtn, { backgroundColor: s.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginLeft: 4 }}>
              Add pet
            </Text>
          </Pressable>
        </View>

        {/* ── Pet list ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.lg, gap: sp.md }}>
          {pets.isLoading ? (
            <ActivityIndicator color={s.primary} style={{ marginTop: 40 }} />
          ) : (pets.data?.length ?? 0) === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: s.surface, borderColor: s.border }]}>
              <Ionicons name="paw-outline" size={48} color={s.textMuted} />
              <Text style={{ color: s.text, fontSize: 16, fontFamily: theme.typography.fontFamilySemibold, marginTop: 12 }}>
                No pets yet
              </Text>
              <Text style={{ color: s.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Add your first pet to start tracking their health and care.
              </Text>
              <Pressable
                onPress={() => router.push('/animale/nou')}
                style={[styles.ctaBtn, { backgroundColor: s.primary, marginTop: 16 }]}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>
                  Add my first pet
                </Text>
              </Pressable>
            </View>
          ) : (
            pets.data?.map((pet) => (
              <Pressable key={pet.id} onPress={() => router.push(`/animale/${pet.id}` as any)}>
                <View style={[styles.petCard, { backgroundColor: s.surface, borderColor: s.border }]}>
                  {/* Hero section */}
                  <View style={[styles.petHero, { backgroundColor: s.surfaceAlt }]}>
                    {pet.photo_url ? (
                      <Image source={{ uri: pet.photo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                      <Ionicons name="paw" size={40} color={s.primary} style={{ opacity: 0.3 }} />
                    )}
                    <View style={styles.speciesBadge}>
                      <Text style={{ color: '#fff', fontSize: 11, fontFamily: theme.typography.fontFamilySemibold }}>
                        {pet.species ?? 'Pet'}
                      </Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ color: s.text, fontSize: 17, fontFamily: theme.typography.fontFamilyBold }}>
                          {pet.name}
                        </Text>
                        <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 2 }}>
                          {pet.breed ?? pet.species ?? ''}
                          {pet.birth_date ? ` · ${getAge(pet.birth_date)}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={s.textMuted} />
                    </View>

                    {/* Quick actions */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); router.push(`/animale/${pet.id}` as any); }}
                        style={[styles.quickAction, { backgroundColor: s.surfaceAlt }]}
                      >
                        <Ionicons name="document-text-outline" size={15} color={s.text} />
                        <Text style={{ color: s.text, fontSize: 12, marginLeft: 4 }}>Records</Text>
                      </Pressable>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); router.push(`/animale/${pet.id}` as any); }}
                        style={[styles.quickAction, { backgroundColor: s.surfaceAlt }]}
                      >
                        <Ionicons name="shield-outline" size={15} color={s.text} />
                        <Text style={{ color: s.text, fontSize: 12, marginLeft: 4 }}>Insurance</Text>
                      </Pressable>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); router.push(`/animale/${pet.id}` as any); }}
                        style={[styles.quickAction, { backgroundColor: s.surfaceAlt }]}
                      >
                        <Ionicons name="airplane-outline" size={15} color={s.text} />
                        <Text style={{ color: s.text, fontSize: 12, marginLeft: 4 }}>Passport</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getAge(birthDate: string): string {
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  return years < 1 ? '< 1 yr' : `${years} yr${years > 1 ? 's' : ''}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  ctaBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  petCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  petHero: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  speciesBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
});
