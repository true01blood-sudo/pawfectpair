/**
 * SwipeCard pentru PetMatch — animație tip Tinder.
 * Utilizează react-native-reanimated 3 + gesture-handler.
 */
import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme-provider';
import type { Pet } from '@pawfectpair/shared';
import { SPECIES_EMOJI, SPECIES_LABELS, calcAge, truncate } from '@pawfectpair/shared';

interface SwipeCardProps {
  pet: Pet;
  ownerName?: string | null;
  onSwipe: (direction: 'left' | 'right') => void;
  index: number;
}

const SWIPE_THRESHOLD = 120;

export function SwipeCard({ pet, ownerName, onSwipe, index }: SwipeCardProps) {
  const t = useAppTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = (heavy: boolean) => {
    Haptics.impactAsync(heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const exceeded = Math.abs(e.translationX) > SWIPE_THRESHOLD;
      if (exceeded) {
        const dir = e.translationX > 0 ? 'right' : 'left';
        runOnJS(triggerHaptic)(dir === 'right');
        translateX.value = withSpring(Math.sign(e.translationX) * 600, { velocity: e.velocityX });
        translateY.value = withSpring(e.translationY, { velocity: e.velocityY });
        runOnJS(onSwipe)(dir);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15], Extrapolate.CLAMP)}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.7, 1.1], Extrapolate.CLAMP) }],
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1.1, 0.7], Extrapolate.CLAMP) }],
  }));

  const age = calcAge(pet.birth_date);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          {
            zIndex: 10 - index,
            backgroundColor: t.colors.surface,
            borderColor: t.colors.border,
          },
        ]}
      >
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 80 }}>{SPECIES_EMOJI[pet.species]}</Text>
          </View>
        )}

        {/* Etichete LIKE / NOPE */}
        <Animated.View style={[styles.badge, styles.likeBadge, likeStyle, { borderColor: t.colors.like }]}>
          <Text style={[styles.badgeText, { color: t.colors.like }]}>INIMIȚĂ ❤</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.nopeBadge, nopeStyle, { borderColor: t.colors.dislike }]}>
          <Text style={[styles.badgeText, { color: t.colors.dislike }]}>SKIP ✕</Text>
        </Animated.View>

        {/* Overlay info jos */}
        <View style={styles.overlay}>
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{pet.name}</Text>
            <Text style={styles.emoji}>{SPECIES_EMOJI[pet.species]}</Text>
          </View>
          <Text style={styles.subtitle}>
            {pet.breed ? `${truncate(pet.breed, 26)} · ` : ''}{age?.label ?? 'Vârstă necunoscută'} · {SPECIES_LABELS[pet.sex]}
          </Text>
          {ownerName && <Text style={styles.owner}>de {ownerName}</Text>}
          {pet.notes && <Text style={styles.notes} numberOfLines={2}>{pet.notes}</Text>}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16, paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: '#fff', fontSize: 26, fontWeight: 'bold', flex: 1 },
  emoji: { fontSize: 24 },
  subtitle: { color: '#fde68a', fontSize: 14, marginTop: 4 },
  owner: { color: '#fbbf24', fontSize: 12, marginTop: 4 },
  notes: { color: '#e5e7eb', fontSize: 13, marginTop: 8 },
  badge: {
    position: 'absolute', top: 40, padding: 6, paddingHorizontal: 12,
    borderWidth: 3, borderRadius: 8,
  },
  likeBadge: { right: 30, transform: [{ rotate: '15deg' }] },
  nopeBadge: { left: 30, transform: [{ rotate: '-15deg' }] },
  badgeText: { fontSize: 22, fontWeight: '900' },
});
