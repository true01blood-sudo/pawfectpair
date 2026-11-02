/**
 * Explore tab — "Explore care near you"
 * Design: pawfectpair-design/petcare-android1.png (middle panel)
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../components/theme-provider';
import { StateView } from '../../components/ui';
import { useVets } from '../../hooks/useVets';
import { useTrainers } from '../../hooks/useEdu';

const SPECIES = ['Dogs', 'Cats', 'Birds', 'Horses', 'Other'] as const;

const CATEGORIES = [
  { id: 'care',      icon: 'medical-outline',       label: 'Care',     route: null },
  { id: 'hotels',    icon: 'bed-outline',            label: 'Hotels',   route: '/modul/petday' },
  { id: 'training',  icon: 'school-outline',         label: 'Training', route: null },
  { id: 'breeding',  icon: 'heart-circle-outline',   label: 'Breeding', route: '/modul/petbreeding' },
  { id: 'adoption',  icon: 'home-outline',           label: 'Adoption', route: '/modul/adoptii' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

interface ProviderCard {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: string | null;
  services: string[];
  price: string | null;
  photoUrl: string | null;
  phone: string | null;
}

export default function ExploreScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState<string>('Dogs');
  const [category, setCategory] = useState<CategoryId>('care');
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);

  const vets = useVets();
  const trainers = useTrainers();

  const isLoading = category === 'care' ? vets.isLoading : category === 'training' ? trainers.isLoading : false;

  const cards: ProviderCard[] = useMemo(() => {
    if (category === 'care') {
      return (vets.data ?? []).map((v) => ({
        id: v.id,
        name: v.clinic_name,
        verified: v.is_licensed,
        rating: v.rating,
        reviewCount: v.reviewCount,
        location: v.city ? `${v.city}${v.address ? ` · ${v.address}` : ''}` : null,
        services: v.services,
        price: v.minPriceCents != null ? `From ${Math.round(v.minPriceCents / 100)} RON` : null,
        photoUrl: v.photo_url,
        phone: v.phone,
      }));
    }
    if (category === 'training') {
      return (trainers.data ?? []).map((t) => ({
        id: t.id,
        name: t.display_name,
        verified: t.verified,
        rating: 0,
        reviewCount: 0,
        location: t.city,
        services: t.specialties,
        price: t.price_range,
        photoUrl: t.photo_url,
        phone: t.phone,
      }));
    }
    return [];
  }, [category, vets.data, trainers.data]);

  const filteredCards = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter((c) =>
      `${c.name} ${c.location ?? ''} ${c.services.join(' ')}`.toLowerCase().includes(needle)
    );
  }, [cards, search]);

  const s = theme.colors;
  const sp = theme.spacing;
  const activeCategory = CATEGORIES.find((c) => c.id === category)!;
  const showInlineCards = category === 'care' || category === 'training';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: sp.xxl + 16 }} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: sp.lg, paddingTop: sp.sm, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: s.text, fontSize: 26, fontFamily: theme.typography.fontFamilyBold, lineHeight: 32 }}>
              Explore care near you
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 14, marginTop: 2 }}>
              Trusted professionals, great care, close to home.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/module')}
            style={[styles.allModulesBtn, { borderColor: s.border, backgroundColor: s.surface }]}
          >
            <Ionicons name="grid-outline" size={20} color={s.text} />
          </Pressable>
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
        </View>

        {/* ── Species filter ── */}
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
              onPress={() => {
                if (cat.route) {
                  router.push(cat.route as any);
                  return;
                }
                setCategory(cat.id);
              }}
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

        {/* ── Map ── */}
        <Pressable onPress={() => router.push('/(tabs)/harta')} style={{ marginHorizontal: sp.lg, marginTop: sp.md }}>
          <View style={[styles.mapPlaceholder, { backgroundColor: s.surfaceAlt, borderColor: s.border }]}>
            <Ionicons name="map" size={40} color={s.primary} style={{ opacity: 0.5 }} />
            <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 6 }}>Tap to open map view</Text>
          </View>
        </Pressable>

        {/* ── Provider cards ── */}
        {showInlineCards && (
          <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md, gap: sp.md }}>
            {isLoading ? (
              <StateView loading />
            ) : filteredCards.length === 0 ? (
              <StateView
                emoji={activeCategory.id === 'care' ? '🩺' : '🎓'}
                title={activeCategory.id === 'care' ? 'Niciun cabinet găsit' : 'Niciun trainer găsit'}
                description={search.trim() ? 'Încearcă un alt termen de căutare.' : 'Nu sunt încă profiluri publice în această categorie.'}
              />
            ) : (
              filteredCards.map((p) => {
                const detailHref = activeCategory.id === 'care' ? `/veterinari/${p.id}` : `/antrenori/${p.id}`;
                return (
                <View key={p.id} style={[styles.providerCard, { backgroundColor: s.surface, borderColor: s.border }]}>
                  <Pressable onPress={() => router.push(detailHref as any)}>
                    <View style={[styles.providerImg, { backgroundColor: s.surfaceAlt }]}>
                      {p.photoUrl ? (
                        <Image source={{ uri: p.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <Ionicons
                          name={activeCategory.id === 'care' ? 'medical' : 'school'}
                          size={30}
                          color={s.primary}
                          style={{ opacity: 0.4 }}
                        />
                      )}
                    </View>
                    <View style={{ padding: 12, paddingBottom: 0, gap: 4 }}>
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
                      {p.reviewCount > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <Text style={{ color: s.text, fontSize: 13 }}>{p.rating.toFixed(1)} ({p.reviewCount})</Text>
                          {p.location && <Text style={{ color: s.textMuted }}>·</Text>}
                          {p.location && <Text style={{ color: s.textMuted, fontSize: 13 }}>{p.location}</Text>}
                        </View>
                      ) : (
                        p.location && <Text style={{ color: s.textMuted, fontSize: 13 }}>{p.location}</Text>
                      )}
                      {p.services.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {p.services.map((sv) => (
                            <View key={sv} style={[styles.serviceBadge, { backgroundColor: s.surfaceAlt }]}>
                              <Text style={{ color: s.textMuted, fontSize: 11 }}>{sv}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Pressable>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    {p.price ? (
                      <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilyBold }}>
                        {p.price}
                      </Text>
                    ) : <View />}
                    {p.phone && (
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${p.phone}`)}
                        style={[styles.viewProfileBtn, { backgroundColor: s.primary }]}
                      >
                        <Ionicons name="call-outline" size={13} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={{ color: '#fff', fontSize: 13, fontFamily: theme.typography.fontFamilySemibold }}>
                          Call
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  allModulesBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
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
  providerCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  providerImg: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
