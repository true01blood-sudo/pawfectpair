/**
 * Explore tab — "Explore care near you"
 * Design: pawfectpair-design/petcare-android1.png (middle panel)
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../components/theme-provider';

const SPECIES = ['Dogs', 'Cats', 'Birds', 'Horses', 'Other'] as const;
const CATEGORIES = [
  { id: 'care',      icon: 'paw',               label: 'Care' },
  { id: 'hotels',   icon: 'bed-outline',        label: 'Hotels' },
  { id: 'training', icon: 'school-outline',     label: 'Training' },
  { id: 'breeding', icon: 'heart-circle-outline', label: 'Breeding' },
  { id: 'adoption', icon: 'home-outline',       label: 'Adoption' },
] as const;

const SAMPLE_PROVIDERS = [
  { id: '1', name: 'Lake Vet Clinic', verified: true, rating: 4.9, reviews: 120, distance: '1.2 km', services: ['General care', 'Vaccinations', 'Diagnostics'], price: 'From 80 RON' },
  { id: '2', name: 'City Pet Hotel',  verified: true, rating: 4.7, reviews: 85,  distance: '2.4 km', services: ['Boarding', 'Grooming', 'Daycare'],              price: 'From 50 RON' },
  { id: '3', name: 'Alpha Training',  verified: false,rating: 4.5, reviews: 42,  distance: '3.1 km', services: ['Basic', 'Advanced', 'Puppy classes'],           price: 'From 40 RON' },
];

export default function ExploreScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState<string>('Dogs');
  const [category, setCategory] = useState('care');
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);

  const s = theme.colors;
  const sp = theme.spacing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: sp.xxl + 16 }} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: sp.lg, paddingTop: sp.sm }}>
          <Text style={{ color: s.text, fontSize: 26, fontFamily: theme.typography.fontFamilyBold, lineHeight: 32 }}>
            Explore care near you
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 14, marginTop: 2 }}>
            Trusted professionals, great care, close to home.
          </Text>
        </View>

        {/* ── Search bar ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md, flexDirection: 'row', gap: 10 }}>
          <View style={[styles.searchBar, { backgroundColor: s.surface, borderColor: s.border }]}>
            <Ionicons name="search-outline" size={18} color={s.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search services, locations..."
              placeholderTextColor={s.textMuted}
              style={{ flex: 1, color: s.text, fontSize: 14, marginLeft: 8 }}
            />
          </View>
          <Pressable style={[styles.filterBtn, { backgroundColor: s.surface, borderColor: s.border }]}>
            <Ionicons name="options-outline" size={20} color={s.text} />
          </Pressable>
        </View>

        {/* ── Species filter + Filters ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.sm, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => setShowSpeciesPicker(!showSpeciesPicker)}
            style={[styles.speciesPill, { backgroundColor: s.primary }]}
          >
            <Ionicons name="paw" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginHorizontal: 6 }}>
              {species}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="options-outline" size={15} color={s.textMuted} />
            <Text style={{ color: s.text, fontSize: 13 }}>Filters</Text>
          </View>
        </View>

        {/* Species picker dropdown */}
        {showSpeciesPicker && (
          <View style={{ paddingHorizontal: sp.lg, marginTop: 6 }}>
            <View style={[styles.speciesDropdown, { backgroundColor: s.surface, borderColor: s.border }]}>
              {SPECIES.map((sp_) => (
                <Pressable
                  key={sp_}
                  onPress={() => { setSpecies(sp_); setShowSpeciesPicker(false); }}
                  style={[styles.speciesOption, sp_ === species && { backgroundColor: `${s.primary}15` }]}
                >
                  <Text style={{ color: sp_ === species ? s.primary : s.text, fontSize: 14 }}>{sp_}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Category tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: sp.md }} contentContainerStyle={{ paddingHorizontal: sp.lg, gap: 10 }}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[
                styles.catTab,
                {
                  backgroundColor: cat.id === category ? `${s.primary}15` : s.surface,
                  borderColor: cat.id === category ? s.primary : s.border,
                },
              ]}
            >
              <Ionicons name={cat.icon as any} size={18} color={cat.id === category ? s.primary : s.textMuted} />
              <Text style={{ color: cat.id === category ? s.primary : s.text, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold, marginTop: 4 }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Map placeholder ── */}
        <Pressable onPress={() => router.push('/(tabs)/harta')} style={{ marginHorizontal: sp.lg, marginTop: sp.md }}>
          <View style={[styles.mapPlaceholder, { backgroundColor: s.surfaceAlt, borderColor: s.border }]}>
            <Ionicons name="map" size={40} color={s.primary} style={{ opacity: 0.5 }} />
            <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 6 }}>Tap to open map view</Text>
            <Pressable style={[styles.viewListBtn, { backgroundColor: s.surface, borderColor: s.border }]}>
              <Ionicons name="list-outline" size={14} color={s.text} />
              <Text style={{ color: s.text, fontSize: 12, marginLeft: 4 }}>View list</Text>
            </Pressable>
          </View>
        </Pressable>

        {/* ── Provider cards ── */}
        <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md, gap: sp.md }}>
          {SAMPLE_PROVIDERS.map((p) => (
            <Pressable key={p.id}>
              <View style={[styles.providerCard, { backgroundColor: s.surface, borderColor: s.border }]}>
                <View style={[styles.providerImg, { backgroundColor: s.surfaceAlt }]}>
                  <Ionicons name="medical" size={30} color={s.primary} style={{ opacity: 0.4 }} />
                </View>
                <Pressable style={styles.favBtn}>
                  <Ionicons name="heart-outline" size={18} color={s.textMuted} />
                </Pressable>
                <View style={{ padding: 12, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: s.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
                      {p.name}
                    </Text>
                    {p.verified && (
                      <View style={[styles.verifiedBadge, { backgroundColor: '#22C55E15' }]}>
                        <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                        <Text style={{ color: '#22C55E', fontSize: 11, marginLeft: 3 }}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={{ color: s.text, fontSize: 13 }}>{p.rating} ({p.reviews})</Text>
                    <Text style={{ color: s.textMuted }}>·</Text>
                    <Text style={{ color: s.textMuted, fontSize: 13 }}>{p.distance}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {p.services.map((sv) => (
                      <View key={sv} style={[styles.serviceBadge, { backgroundColor: s.surfaceAlt }]}>
                        <Text style={{ color: s.textMuted, fontSize: 11 }}>{sv}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilyBold }}>
                      {p.price}
                    </Text>
                    <Pressable style={[styles.viewProfileBtn, { backgroundColor: s.primary }]}>
                      <Text style={{ color: '#fff', fontSize: 13, fontFamily: theme.typography.fontFamilySemibold }}>
                        View profile
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speciesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speciesDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  speciesOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  catTab: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 72,
  },
  mapPlaceholder: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  viewListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  providerCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  providerImg: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  viewProfileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
