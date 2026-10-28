/**
 * Home — "Your pet people" social feed
 * Design: pawfectpair-design/petcare-android1.png
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl,
  Image as RNImage, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../../components/theme-provider';
import { Card } from '../../components/ui';
import { useMyPets } from '../../hooks';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/auth.store';

const FEED_TABS = ['Following', 'For you', 'Local'] as const;
type FeedTab = typeof FEED_TABS[number];

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const pets = useMyPets();
  const profile = useProfile();
  const session = useAuthStore((s) => s.session);
  const [activeTab, setActiveTab] = useState<FeedTab>('For you');
  const [refreshing, setRefreshing] = useState(false);

  const firstName = profile.data?.full_name?.split(' ')[0] ?? 'there';
  const activePet = pets.data?.[0];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([pets.refetch(), profile.refetch()]);
    setRefreshing(false);
  };

  const s = theme.colors;
  const sp = theme.spacing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: sp.xxl + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[s.primary]} tintColor={s.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: sp.lg, paddingTop: sp.sm }]}>
          <Pressable style={[styles.locationPill, { backgroundColor: s.surface, borderColor: s.border }]}>
            <Ionicons name="location-outline" size={14} color={s.primary} />
            <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginHorizontal: 4 }}>
              My location
            </Text>
            <Ionicons name="chevron-down" size={12} color={s.textMuted} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/profil')}
              style={[styles.iconBtn, { backgroundColor: s.surface, borderColor: s.border }]}
            >
              <Ionicons name="notifications-outline" size={20} color={s.text} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/comunitate')}
              style={[styles.iconBtn, { backgroundColor: s.surface, borderColor: s.border }]}
            >
              <Ionicons name="chatbubble-outline" size={20} color={s.text} />
            </Pressable>
          </View>
        </View>

        {/* ── Title ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md }}>
          <Text style={{ color: s.text, fontSize: 28, fontFamily: theme.typography.fontFamilyBold, lineHeight: 34 }}>
            Your pet people
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 14, marginTop: 2 }}>
            Local stories, events and tips for happier pets.
          </Text>
        </View>

        {/* ── Pet avatar row ── */}
        {(pets.data?.length ?? 0) > 0 && (
          <View style={{ marginTop: sp.lg }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: sp.lg, gap: 16 }}>
              {pets.data?.map((pet, i) => (
                <Pressable key={pet.id} onPress={() => router.push(`/animale/${pet.id}`)} style={{ alignItems: 'center', gap: 4 }}>
                  <View style={[
                    styles.petAvatar,
                    { borderColor: i === 0 ? s.primary : 'transparent', borderWidth: 2 },
                  ]}>
                    {pet.photo_url ? (
                      <Image source={{ uri: pet.photo_url }} style={{ width: 52, height: 52, borderRadius: 26 }} contentFit="cover" />
                    ) : (
                      <View style={[styles.petAvatarFallback, { backgroundColor: s.surface }]}>
                        <Ionicons name="paw" size={24} color={s.primary} />
                      </View>
                    )}
                  </View>
                  <Text style={{ color: s.text, fontSize: 11, fontFamily: theme.typography.fontFamilySemibold }}>
                    {pet.name}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => router.push('/animale/nou')} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.petAvatarFallback, { backgroundColor: s.surface, borderColor: s.border, borderWidth: 1 }]}>
                  <Ionicons name="add" size={24} color={s.textMuted} />
                </View>
                <Text style={{ color: s.textMuted, fontSize: 11 }}>Add pet</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* ── Upcoming reminder (if pet has appointments) ── */}
        {activePet && (
          <Pressable
            onPress={() => router.push('/(tabs)/ingrijire')}
            style={{ paddingHorizontal: sp.lg, marginTop: sp.md }}
          >
            <View style={[styles.reminderCard, { backgroundColor: s.surface, borderColor: s.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                {activePet.photo_url ? (
                  <Image source={{ uri: activePet.photo_url }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
                ) : (
                  <View style={[styles.petAvatarFallback, { backgroundColor: s.background, width: 40, height: 40 }]}>
                    <Ionicons name="paw" size={18} color={s.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>
                    {activePet.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="calendar-outline" size={12} color={s.textMuted} />
                    <Text style={{ color: s.textMuted, fontSize: 12 }}>Annual check-up</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="location-outline" size={12} color={s.textMuted} />
                    <Text style={{ color: s.textMuted, fontSize: 12 }}>Tomorrow, 10:30</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={s.textMuted} />
            </View>
          </Pressable>
        )}

        {/* ── Feed tabs ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.lg }}>
          <View style={[styles.tabRow, { borderColor: s.border }]}>
            {FEED_TABS.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabPill,
                  activeTab === tab
                    ? { backgroundColor: s.primary }
                    : { backgroundColor: s.surface, borderColor: s.border, borderWidth: 1 },
                ]}
              >
                <Text style={{
                  color: activeTab === tab ? '#fff' : s.text,
                  fontSize: 13,
                  fontFamily: theme.typography.fontFamilySemibold,
                }}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Feed content ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md, gap: sp.md }}>
          {/* Community event card */}
          <Pressable onPress={() => router.push('/(tabs)/cercuri')}>
            <View style={[styles.feedCard, { backgroundColor: s.surface, borderColor: s.border }]}>
              <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: s.surfaceAlt }}>
                <View style={{ position: 'absolute', bottom: 10, left: 12, zIndex: 1 }}>
                  <View style={{ backgroundColor: s.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: theme.typography.fontFamilySemibold }}>
                      Community event
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="people" size={48} color={s.primary} style={{ opacity: 0.3 }} />
                </View>
              </View>
              <View style={{ padding: 12, gap: 6 }}>
                <Text style={{ color: s.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
                  Weekend pack walk
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="calendar-outline" size={13} color={s.textMuted} />
                    <Text style={{ color: s.textMuted, fontSize: 12 }}>Sat · 10:00</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location-outline" size={13} color={s.textMuted} />
                    <Text style={{ color: s.textMuted, fontSize: 12 }}>Local park</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: s.textMuted, fontSize: 12 }}>8 going</Text>
                  <Pressable
                    style={[styles.joinBtn, { backgroundColor: s.primary }]}
                    onPress={() => router.push('/(tabs)/cercuri')}
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: theme.typography.fontFamilySemibold }}>
                      Join
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Vet tips card */}
          <Pressable onPress={() => router.push('/(tabs)/ingrijire')}>
            <View style={[styles.tipsCard, { backgroundColor: s.surface, borderColor: s.border }]}>
              <View style={[styles.tipsBadge, { backgroundColor: `${s.primary}18` }]}>
                <Text style={{ color: s.primary, fontSize: 11, fontFamily: theme.typography.fontFamilySemibold }}>
                  Vet tips
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4, marginLeft: 12 }}>
                <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>
                  Spring health check
                </Text>
                <Text style={{ color: s.textMuted, fontSize: 12 }}>
                  5 simple things to keep your pet in top shape
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={s.textMuted} />
            </View>
          </Pressable>

          {/* Quick actions row */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: sp.sm }}>
            <Pressable onPress={() => router.push('/(tabs)/explorare')} style={{ flex: 1 }}>
              <View style={[styles.quickAction, { backgroundColor: s.surface, borderColor: s.border }]}>
                <View style={[styles.quickIcon, { backgroundColor: `${s.primary}15` }]}>
                  <Ionicons name="search" size={20} color={s.primary} />
                </View>
                <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 6 }}>
                  Find care
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/petmatch')} style={{ flex: 1 }}>
              <View style={[styles.quickAction, { backgroundColor: s.surface, borderColor: s.border }]}>
                <View style={[styles.quickIcon, { backgroundColor: `${s.primary}15` }]}>
                  <Ionicons name="heart" size={20} color={s.primary} />
                </View>
                <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 6 }}>
                  PetMatch
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/harta')} style={{ flex: 1 }}>
              <View style={[styles.quickAction, { backgroundColor: s.surface, borderColor: s.border }]}>
                <View style={[styles.quickIcon, { backgroundColor: `${s.primary}15` }]}>
                  <Ionicons name="map" size={20} color={s.primary} />
                </View>
                <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 6 }}>
                  Map
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  petAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 0,
  },
  tipsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickAction: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
