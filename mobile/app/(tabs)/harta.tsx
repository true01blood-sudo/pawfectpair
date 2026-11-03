/**
 * Ecran Hartă — locuri pet-friendly în apropiere (veterinari, magazine,
 * adăposturi, traineri). Date reale: vets (fără coordonate încă — doar
 * listă) + business_listings (OSM + ACh.ro, cu coordonate — pini pe
 * hartă). Vezi scripts/business-import/ pentru sursa datelor.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView } from '../../components/ui';
import { useLocation, sortByDistance, type PetPlace } from '../../lib/location';
import { useBusinessListings, useVets } from '../../hooks';
import type { BusinessListingCategory } from '../../lib/supabase/queries';

type FilterType = 'all' | 'vet' | 'shop' | 'shelter' | 'trainer';

const PLACE_META: Record<PetPlace['type'], { emoji: string; color: string; label: string }> = {
  vet:     { emoji: '🏥', color: '#DC2626', label: 'Veterinari' },
  shop:    { emoji: '🛍️', color: '#EC4899', label: 'Magazine' },
  shelter: { emoji: '🏠', color: '#F59E0B', label: 'Adăposturi' },
  trainer: { emoji: '🎓', color: '#7C3AED', label: 'Traineri' },
};

const CATEGORY_TO_TYPE: Record<BusinessListingCategory, PetPlace['type']> = {
  pet_shop: 'shop',
  shelter: 'shelter',
  trainer: 'trainer',
};

export default function HartaScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const { status, coords, getCurrentLocation } = useLocation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<'map' | 'list'>('map');

  const listingsQuery = useBusinessListings();
  const vetsQuery = useVets();
  const loading = listingsQuery.isLoading || vetsQuery.isLoading;

  const places: PetPlace[] = useMemo(() => {
    const listings: PetPlace[] = (listingsQuery.data ?? []).map((l) => ({
      id: `biz-${l.id}`,
      name: l.name,
      type: CATEGORY_TO_TYPE[l.category],
      coords: l.lat != null && l.lng != null ? { latitude: l.lat, longitude: l.lng } : undefined,
      address: [l.address, l.city].filter(Boolean).join(', ') || undefined,
      phone: l.phone ?? undefined,
      website: l.website ?? undefined,
    }));
    const vets: PetPlace[] = (vetsQuery.data ?? []).map((v) => ({
      id: `vet-${v.id}`,
      name: v.clinic_name,
      type: 'vet',
      coords: undefined, // vets nu are inca coordonate reale — doar in lista
      address: [v.address, v.city].filter(Boolean).join(', ') || undefined,
      phone: v.phone ?? undefined,
      rating: v.rating > 0 ? v.rating : undefined,
    }));
    return [...vets, ...listings];
  }, [listingsQuery.data, vetsQuery.data]);

  // Sortăm locurile după distanță când avem locația curentă (cele fără coords rămân la final)
  const sorted = useMemo(() => (coords ? sortByDistance(places, coords) : places), [places, coords]);

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted;
    return sorted.filter((p) => p.type === filter);
  }, [sorted, filter]);

  const mappable = useMemo(() => filtered.filter((p): p is PetPlace & { coords: NonNullable<PetPlace['coords']> } => !!p.coords), [filtered]);

  // Default region — București centru
  const initialRegion = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 44.4268, longitude: 26.1025, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Stack.Screen options={{ title: t('map.title') }} />

      {/* Header + view toggle */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{t('map.title')}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t('map.subtitle')}</Text>
        </View>
        <View style={[styles.viewToggle, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
          <Pressable
            onPress={() => setView('map')}
            style={[styles.toggleBtn, view === 'map' && { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="map" size={16} color={view === 'map' ? '#fff' : theme.colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => setView('list')}
            style={[styles.toggleBtn, view === 'list' && { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="list" size={16} color={view === 'list' ? '#fff' : theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Filtre */}
      <View style={[styles.filters, { backgroundColor: theme.colors.surface }]}>
        <FilterChip label={t('map.nearby')} active={filter === 'all'} onPress={() => setFilter('all')} color={theme.colors.primary} />
        {(Object.keys(PLACE_META) as PetPlace['type'][]).map((type) => (
          <FilterChip
            key={type}
            label={`${PLACE_META[type].emoji} ${PLACE_META[type].label}`}
            active={filter === type}
            onPress={() => setFilter(type)}
            color={theme.colors.primary}
          />
        ))}
      </View>

      {/* Permisiune locație */}
      {status === 'denied' && (
        <View style={[styles.locationPrompt, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
          <Text style={{ fontSize: 32, textAlign: 'center' }}>📍</Text>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 8 }}>
            {t('map.enableLocation')}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            {t('map.enableLocationDesc')}
          </Text>
          <Button title={t('map.enable')} onPress={getCurrentLocation} style={{ marginTop: 12 }} size="md" />
        </View>
      )}

      {/* Conținut principal */}
      {status !== 'denied' && (
        <>
          {view === 'map' ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={initialRegion}
              region={coords ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined}
              showsUserLocation={status === 'granted'}
              showsMyLocationButton
            >
              {mappable.map((place) => {
                const meta = PLACE_META[place.type];
                return (
                  <Marker
                    key={place.id}
                    coordinate={place.coords}
                    pinColor={meta.color}
                  >
                    <Callout>
                      <View style={{ maxWidth: 200 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13 }}>{meta.emoji} {place.name}</Text>
                        {place.address && <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{place.address}</Text>}
                        {place.distance !== undefined && (
                          <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                            📍 {place.distance.toFixed(1)} km
                          </Text>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center', flexGrow: 1 }}
              ListEmptyComponent={
                <StateView
                  loading={loading}
                  empty={!loading}
                  emoji="🗺️"
                  title="Niciun rezultat"
                  description="Nu am găsit încă locuri în această categorie."
                />
              }
              renderItem={({ item }) => {
                const meta = PLACE_META[item.type];
                return (
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.placeIcon, { backgroundColor: meta.color + '22' }]}>
                      <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.address && (
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                          📍 {item.address}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {item.distance !== undefined && (
                          <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                            {item.distance.toFixed(1)} km
                          </Text>
                        )}
                        {item.rating && (
                          <Text style={{ color: theme.colors.accent, fontSize: 11 }}>⭐ {item.rating.toFixed(1)}</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      {item.phone && (
                        <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                          <Ionicons name="call" size={20} color={theme.colors.primary} />
                        </Pressable>
                      )}
                      {item.coords && (
                        <Pressable onPress={() => {
                          const url = Platform.select({
                            ios: `maps://?daddr=${item.coords!.latitude},${item.coords!.longitude}`,
                            android: `google.navigation:q=${item.coords!.latitude},${item.coords!.longitude}`,
                          });
                          if (url) Linking.openURL(url);
                        }}>
                          <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                        </Pressable>
                      )}
                    </View>
                  </Card>
                );
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? color : '#E5E7EB', backgroundColor: active ? color : 'transparent' }]}
    >
      <Text style={{ color: active ? '#fff' : '#666', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: 8,
    paddingHorizontal: 12,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4D9B0',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  locationPrompt: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
