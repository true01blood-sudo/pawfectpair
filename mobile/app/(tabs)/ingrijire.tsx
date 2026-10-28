/**
 * Care tab — "My pets / Care hub"
 * Design: pawfectpair-design/petcare-android2.png (right panel) + 6.png
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../../components/theme-provider';
import { useMyPets } from '../../hooks';
import { useProfile } from '../../hooks/useProfile';

const CARE_ITEMS = [
  { id: 'health',    icon: 'document-text-outline',  label: 'Health records',  value: '5 items',     route: '/modul/petwell' },
  { id: 'meds',      icon: 'medical-outline',         label: 'Medication',      value: '2 active',    route: '/modul/petwell' },
  { id: 'nutrition', icon: 'nutrition-outline',       label: 'Nutrition',       value: 'Custom plan', route: '/modul/petwell' },
  { id: 'insurance', icon: 'shield-checkmark-outline',label: 'Insurance',       value: 'Active',      route: '/modul/petinsurance' },
  { id: 'devices',   icon: 'hardware-chip-outline',   label: 'Devices',         value: '1 connected', route: '/modul/petsos' },
] as const;

export default function CareScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const pets = useMyPets();
  const profile = useProfile();
  const [selectedPetIdx, setSelectedPetIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const s = theme.colors;
  const sp = theme.spacing;

  const onRefresh = async () => {
    setRefreshing(true);
    await pets.refetch();
    setRefreshing(false);
  };

  const petList = pets.data ?? [];
  const activePet = petList[selectedPetIdx] ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: sp.xxl + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[s.primary]} tintColor={s.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: sp.lg, paddingTop: sp.sm }]}>
          <Text style={{ color: s.text, fontSize: 24, fontFamily: theme.typography.fontFamilyBold }}>
            My pets
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => router.push('/(tabs)/profil')} style={[styles.iconBtn, { borderColor: s.border, backgroundColor: s.surface }]}>
              <Ionicons name="settings-outline" size={20} color={s.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/animale/nou')} style={[styles.iconBtn, { borderColor: s.border, backgroundColor: s.surface }]}>
              <Ionicons name="add" size={22} color={s.text} />
            </Pressable>
          </View>
        </View>

        {/* ── Pet avatar row ── */}
        {petList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: sp.md }} contentContainerStyle={{ paddingHorizontal: sp.lg, gap: 20 }}>
            {petList.map((pet, i) => (
              <Pressable key={pet.id} onPress={() => setSelectedPetIdx(i)} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[
                  styles.petRing,
                  { borderColor: i === selectedPetIdx ? s.primary : 'transparent' },
                ]}>
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={{ width: 52, height: 52, borderRadius: 26 }} contentFit="cover" />
                  ) : (
                    <View style={[styles.petFallback, { backgroundColor: s.surfaceAlt }]}>
                      <Ionicons name="paw" size={22} color={s.primary} />
                    </View>
                  )}
                </View>
                <Text style={{ color: i === selectedPetIdx ? s.text : s.textMuted, fontSize: 11, fontFamily: theme.typography.fontFamilySemibold }}>
                  {pet.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Hero image ── */}
        {activePet && (
          <View style={{ marginTop: sp.md, marginHorizontal: sp.lg, borderRadius: 16, overflow: 'hidden', height: 190, backgroundColor: s.surfaceAlt }}>
            {activePet.photo_url ? (
              <Image source={{ uri: activePet.photo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="paw" size={60} color={s.primary} style={{ opacity: 0.3 }} />
              </View>
            )}
            <View style={styles.heroOverlay}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 20, fontFamily: theme.typography.fontFamilyBold }}>
                  {activePet.name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  {activePet.species ?? 'Pet'}
                  {activePet.breed ? ` · ${activePet.breed}` : ''}
                  {activePet.birth_date ? ` · ${getAge(activePet.birth_date)}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/animale/${activePet.id}`)}
                style={[styles.cameraBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              >
                <Ionicons name="camera-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Next appointment ── */}
        <Pressable onPress={() => router.push('/modul/petplanner')} style={{ marginHorizontal: sp.lg, marginTop: sp.md }}>
          <View style={[styles.apptCard, { backgroundColor: s.surface, borderColor: s.border }]}>
            <View style={[styles.apptIcon, { backgroundColor: `${s.primary}15` }]}>
              <Ionicons name="calendar-outline" size={20} color={s.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: s.textMuted, fontSize: 12 }}>Next appointment</Text>
              <Text style={{ color: s.text, fontSize: 15, fontFamily: theme.typography.fontFamilySemibold }}>
                General consultation
              </Text>
              <Text style={{ color: s.textMuted, fontSize: 12 }}>Book at local vet clinic</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={s.textMuted} />
          </View>
        </Pressable>

        {/* ── Today's tasks ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.sm }}>
            <Text style={{ color: s.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
              Today's tasks
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 12 }}>0 of 3 done</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {[
              { icon: 'walk-outline',    label: 'Morning walk',    time: '08:00', done: false },
              { icon: 'medical-outline', label: 'Give medication', time: '12:00', done: false },
              { icon: 'walk-outline',    label: 'Evening walk',    time: '18:00', done: false },
            ].map((task, i) => (
              <View key={i} style={[styles.taskChip, { backgroundColor: s.surface, borderColor: s.border }]}>
                <Ionicons name={task.icon as any} size={16} color={task.done ? '#22C55E' : s.textMuted} />
                <View style={{ marginTop: 4 }}>
                  <Text style={{ color: s.text, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>
                    {task.label}
                  </Text>
                  <Text style={{ color: s.textMuted, fontSize: 11 }}>
                    {task.done ? 'Done' : `Due ${task.time}`}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Care modules list ── */}
        <View style={{ marginHorizontal: sp.lg, marginTop: sp.lg, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: s.border }}>
          {CARE_ITEMS.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={[
                styles.careRow,
                { backgroundColor: s.surface },
                i < CARE_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: s.border },
              ]}
            >
              <Ionicons name={item.icon as any} size={20} color={s.text} />
              <Text style={{ color: s.text, fontSize: 15, flex: 1, marginLeft: 12 }}>
                {item.label}
              </Text>
              <Text style={{ color: s.textMuted, fontSize: 13 }}>{item.value}</Text>
              <Ionicons name="chevron-forward" size={16} color={s.textMuted} style={{ marginLeft: 6 }} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getAge(birthDate: string): string {
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  return years < 1 ? '< 1 year' : `${years} year${years > 1 ? 's' : ''}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cameraBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  apptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskChip: {
    width: 110,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  careRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
});
