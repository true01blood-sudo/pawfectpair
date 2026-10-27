/**
 * PetBreeding — descoperire parteneri reproducere.
 * Design: swipe cards (ca în mockup "Find a breeding partner") cu back/X/heart,
 * filtru specie/rasă/locație, profil detaliat stud cu pedigree + health tests.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.3 * SCREEN_WIDTH;

type BreedingCard = {
  id: string;
  name: string;
  breed: string;
  age: string;
  sex: 'M' | 'F';
  location: string;
  distance: string;
  price: string;
  currency: string;
  rating: number;
  reviews: number;
  litters: number;
  offspring: number;
  emoji: string;
  badges: string[];
  healthTests: string[];
  isDemo?: boolean;
};

const DEMO_CARDS: BreedingCard[] = [
  {
    id: '1',
    name: 'Atlas',
    breed: 'Labrador Retriever',
    age: '4 ani',
    sex: 'M',
    location: 'Lugano',
    distance: '12 km',
    price: '900',
    currency: 'CHF',
    rating: 4.9,
    reviews: 28,
    litters: 12,
    offspring: 56,
    emoji: '🐶',
    badges: ['Show champion', 'Campeón'],
    healthTests: ['HD-A', 'ED-0', 'Clear (prcd-PRA)'],
    isDemo: true,
  },
  {
    id: '2',
    name: 'Luna',
    breed: 'Golden Retriever',
    age: '3 ani',
    sex: 'F',
    location: 'Zürich',
    distance: '35 km',
    price: '800',
    currency: 'CHF',
    rating: 4.8,
    reviews: 18,
    litters: 6,
    offspring: 32,
    emoji: '🐕',
    badges: ['FCI registered', 'Health tested'],
    healthTests: ['HD-B', 'OFA Clear', 'DNA tested'],
    isDemo: true,
  },
  {
    id: '3',
    name: 'Orion',
    breed: 'Warmblood (Zangersheide)',
    age: '8 ani',
    sex: 'M',
    location: 'Lugano',
    distance: '5 km',
    price: '1,500',
    currency: 'EUR',
    rating: 4.9,
    reviews: 41,
    litters: 0,
    offspring: 0,
    emoji: '🐴',
    badges: ['ZANG registered', 'Approved for breeding', 'WFFS-free'],
    healthTests: ['CA-free', 'WFFS neg', 'Sportpferd'],
    isDemo: true,
  },
];

type FilterChip = { key: string; label: string };
const SPECIES_FILTERS: FilterChip[] = [
  { key: 'all', label: 'Toate' },
  { key: 'dogs', label: 'Câini' },
  { key: 'cats', label: 'Pisici' },
  { key: 'horses', label: 'Cai' },
];

export default function PetBreedingScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);

  const position = useRef(new Animated.ValueXY()).current;

  const card = DEMO_CARDS[currentIdx];
  const isFinished = currentIdx >= DEMO_CARDS.length;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
  });
  const passOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) swipeRight();
      else if (g.dx < -SWIPE_THRESHOLD) swipeLeft();
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });

  function swipeRight() {
    setLastAction('like');
    setLikedIds((prev) => [...prev, card.id]);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => { position.setValue({ x: 0, y: 0 }); setCurrentIdx((i) => i + 1); });
  }

  function swipeLeft() {
    setLastAction('pass');
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => { position.setValue({ x: 0, y: 0 }); setCurrentIdx((i) => i + 1); });
  }

  function undoLast() {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: theme.typography.fontFamilyBold }}>
          {t('breeding.title', 'Reproducere')}
        </Text>
        <Pressable hitSlop={8}>
          <Ionicons name="options" size={24} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Filtre specie */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: 'row', paddingVertical: 8 }}>
        {SPECIES_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setSpeciesFilter(f.key)}
            style={[styles.chip, {
              backgroundColor: speciesFilter === f.key ? theme.colors.primary : theme.colors.surface,
              borderColor: speciesFilter === f.key ? theme.colors.primary : theme.colors.border,
            }]}
          >
            <Text style={{ color: speciesFilter === f.key ? '#fff' : theme.colors.text, fontSize: 13, fontWeight: '600' }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
        <Pressable style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="options-outline" size={14} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Filtre</Text>
        </Pressable>
      </ScrollView>

      {/* Swipe area */}
      <View style={styles.swipeArea}>
        {isFinished ? (
          <View style={styles.finishedState}>
            <Text style={{ fontSize: 48 }}>🌸</Text>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
              {t('breeding.noMore', 'Ai văzut toți partenerii disponibili')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {t('breeding.noMoreDesc', 'Încearcă să schimbi filtrele sau revino mai târziu')}
            </Text>
            <Pressable
              onPress={() => setCurrentIdx(0)}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {t('breeding.restart', 'Reîncepere')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Card următor (fundal) */}
            {currentIdx + 1 < DEMO_CARDS.length && (
              <View style={[styles.card, styles.cardBehind, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={{ fontSize: 80, textAlign: 'center', paddingTop: 40 }}>{DEMO_CARDS[currentIdx + 1].emoji}</Text>
              </View>
            )}

            {/* Card curent */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
              ]}
            >
              {/* LIKE overlay */}
              <Animated.View style={[styles.overlayBadge, styles.overlayLike, { opacity: likeOpacity }]}>
                <Text style={{ color: '#22C55E', fontSize: 22, fontWeight: '800', borderWidth: 3, borderColor: '#22C55E', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>LIKE</Text>
              </Animated.View>
              {/* PASS overlay */}
              <Animated.View style={[styles.overlayBadge, styles.overlayPass, { opacity: passOpacity }]}>
                <Text style={{ color: '#EF4444', fontSize: 22, fontWeight: '800', borderWidth: 3, borderColor: '#EF4444', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>PASS</Text>
              </Animated.View>

              {/* Foto placeholder */}
              <View style={[styles.cardPhoto, { backgroundColor: theme.colors.accent }]}>
                <Text style={{ fontSize: 96 }}>{card.emoji}</Text>
                {card.isDemo && (
                  <View style={[styles.demoBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Demo</Text>
                  </View>
                )}
                <View style={[styles.priceTag, { backgroundColor: '#fff' }]}>
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>
                    {card.currency} {card.price}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}> / serviciu</Text>
                </View>
              </View>

              {/* Info card */}
              <View style={{ padding: 16 }}>
                <View style={styles.cardTitleRow}>
                  <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: theme.typography.fontFamilyBold }}>
                    {card.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{card.rating}</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>({card.reviews})</Text>
                  </View>
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  {card.breed} · {card.age} · {card.sex === 'M' ? 'Mascul' : 'Femelă'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{card.location} · {card.distance}</Text>
                </View>

                {/* Health tests */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {card.healthTests.map((ht) => (
                    <View key={ht} style={[styles.healthChip, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                      <Ionicons name="shield-checkmark" size={11} color="#16A34A" />
                      <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '600' }}>{ht}</Text>
                    </View>
                  ))}
                </View>

                {/* Stats */}
                {card.litters > 0 && (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 8 }}>
                    ⭐ {card.rating} ({card.reviews} servicii) · {card.litters} pui · {card.offspring} descendenți
                  </Text>
                )}
              </View>
            </Animated.View>
          </>
        )}
      </View>

      {/* Butoane acțiune */}
      {!isFinished && (
        <View style={styles.actionRow}>
          <Pressable onPress={undoLast} style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="return-up-back" size={20} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable onPress={swipeLeft} style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="close" size={28} color="#EF4444" />
          </Pressable>
          <Pressable onPress={swipeRight} style={[styles.actionBtn, { backgroundColor: '#FFF0E8', borderColor: '#FDBA74' }]}>
            <Ionicons name="heart" size={28} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => {}}
            style={[styles.actionBtn, styles.actionBtnSm, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Ionicons name="person" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* CTA View profile */}
      {!isFinished && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Pressable style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {t('breeding.viewProfile', 'Vezi profilul complet')}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  swipeArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardBehind: {
    top: 12, transform: [{ scale: 0.96 }],
  },
  cardPhoto: {
    height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  demoBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  priceTag: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  overlayBadge: { position: 'absolute', top: 24, zIndex: 10 },
  overlayLike: { right: 20 },
  overlayPass: { left: 20 },
  actionRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 16, paddingVertical: 12, paddingHorizontal: 20,
  },
  actionBtn: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  actionBtnSm: { width: 46, height: 46, borderRadius: 23 },
  primaryBtn: {
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
  },
  finishedState: { alignItems: 'center', padding: 32 },
});
