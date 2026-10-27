/**
 * Ecran Hartă — locuri pet-friendly în apropiere (veterinari, parcuri, magazine).
 * Folosește react-native-maps + expo-location.
 * Demo data în Faza 1; integrare Google Places API în Faza 2.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView } from '../../components/ui';
import { useLocation, sortByDistance, DEMO_PET_PLACES, calcDistanceKm, type PetPlace } from '../../lib/location';

type FilterType = 'all' | 'vet' | 'park' | 'shop' | 'shelter' | 'event';

const PLACE_META: Record<PetPlace['type'], { emoji: string; color: string; labelKey: string }> = {
  vet:     { emoji: '🏥', color: '#DC2626', labelKey: 'map.vets' },
  park:    { emoji: '🌳', color: '#16A34A', labelKey: 'map.parks' },
  shop:    { emoji: '🛍️', color: '#EC4899', labelKey: 'map.shops' },
  shelter: { emoji: '🏠', color: '#F59E0B', labelKey: 'map.shelters' },
  event:   { emoji: '🎪', color: '#8B5CF6', labelKey: 'map.events' },
};

export default function HartaScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const { status, coords, getCurrentLocation, error } = useLocation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<'map' | 'list'>('map');

  // Sortăm locurile după distanță când avem locația curentă
  const places = useMemo(() => {
    if (coords) return sortByDistance(DEMO_PET_PLACES, coords);
    return DEMO_PET_PLACES;
  }, [coords]);

  const filtered = useMemo(() => {
    if (filter === 'all') return places;
    return places.filter((p) => p.type === filter);
  }, [places, filter]);

  // Default region — București centru
  const initialRegion = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 44.4268, longitude: 26.1025, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
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
        <FilterChip label={`🏥 ${t('map.vets')}`} active={filter === 'vet'} onPress={() => setFilter('vet')} color={theme.colors.primary} />
        <FilterChip label={`🌳 ${t('map.parks')}`} active={filter === 'park'} onPress={() => setFilter('park')} color={theme.colors.primary} />
        <FilterChip label={`🛍️ ${t('map.shops')}`} active={filter === 'shop'} onPress={() => setFilter('shop')} color={theme.colors.primary} />
        <FilterChip label={`🏠 ${t('map.shelters')}`} active={filter === 'shelter'} onPress={() => setFilter('shelter')} color={theme.colors.primary} />
        <FilterChip label={`🎪 ${t('map.events')}`} active={filter === 'event'} onPress={() => setFilter('event')} color={theme.colors.primary} />
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
              {filtered.map((place) => {
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
                        <Text style={{ fontSize: 11, marginTop: 2, color: place.isOpen ? '#16A34A' : '#DC2626', fontWeight: '600' }}>
                          {place.isOpen ? `🟢 ${t('map.open')}` : `🔴 ${t('map.closed')}`}
                        </Text>
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
              contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm , maxWidth: 720, width: '100%', alignSelf: 'center' }}
              ListEmptyComponent={
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textMuted }}>{t('app.loading')}</Text>
                </View>
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
                        <Text style={{ color: item.isOpen ? theme.colors.success : theme.colors.danger, fontSize: 11, fontWeight: '600' }}>
                          {item.isOpen ? `🟢 ${t('map.open')}` : `🔴 ${t('map.closed')}`}
                        </Text>
                        {item.distance !== undefined && (
                          <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                            · {item.distance.toFixed(1)} km
                          </Text>
                        )}
                        {item.rating && (
                          <Text style={{ color: theme.colors.accent, fontSize: 11 }}>· ⭐ {item.rating}</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      {item.phone && (
                        <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                          <Ionicons name="call" size={20} color={theme.colors.primary} />
                        </Pressable>
                      )}
                      <Pressable onPress={() => {
                        const url = Platform.select({
                          ios: `maps://?daddr=${item.coords.latitude},${item.coords.longitude}`,
                          android: `google.navigation:q=${item.coords.latitude},${item.coords.longitude}`,
                        });
                        if (url) Linking.openURL(url);
                      }}>
                        <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                      </Pressable>
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
