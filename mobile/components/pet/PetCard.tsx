import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useAppTheme } from '../theme-provider';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import type { Pet } from '@pawfectpair/shared';
import { SPECIES_EMOJI, SPECIES_LABELS } from '@pawfectpair/shared';
import { calcAge } from '@pawfectpair/shared';
import { truncate } from '@pawfectpair/shared';

interface PetCardProps {
  pet: Pet;
  onPress?: (pet: Pet) => void;
  ownerName?: string | null;
  ownerAvatar?: string | null;
}

export function PetCard({ pet, onPress, ownerName, ownerAvatar }: PetCardProps) {
  const t = useAppTheme();
  const age = calcAge(pet.birth_date);

  return (
    <Pressable onPress={() => onPress?.(pet)} accessibilityRole="button">
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {pet.photo_url ? (
          <Image
            source={{ uri: pet.photo_url }}
            style={{ width: '100%', height: 160 }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: t.colors.surfaceAlt }]}>
            <Text style={{ fontSize: 56 }}>{SPECIES_EMOJI[pet.species]}</Text>
          </View>
        )}
        <View style={{ padding: t.spacing.md }}>
          <View style={styles.row}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold, flex: 1 }} numberOfLines={1}>
              {pet.name}
            </Text>
            <Text style={{ fontSize: t.typography.fontSizeMd }}>{SPECIES_EMOJI[pet.species]}</Text>
          </View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm }}>
            {pet.breed ? `${truncate(pet.breed, 24)} · ` : ''}{age?.label ?? 'Vârstă necunoscută'}
          </Text>
          <View style={[styles.row, { marginTop: t.spacing.sm }]}>
            <View style={[styles.chip, { backgroundColor: t.colors.primaryLight }]}>
              <Text style={{ color: t.colors.primaryDark, fontSize: t.typography.fontSizeXs, fontFamily: t.typography.fontFamilyMedium }}>
                {SPECIES_LABELS[pet.sex]}
              </Text>
            </View>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs, marginLeft: 'auto' }}>
              {pet.species}
            </Text>
          </View>
          {(ownerName || ownerAvatar) && (
            <View style={[styles.row, { marginTop: t.spacing.sm }]}>
              <Avatar uri={ownerAvatar} name={ownerName} size={20} />
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs, marginLeft: t.spacing.xs }} numberOfLines={1}>
                {ownerName ?? 'Proprietar'}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  placeholder: { width: '100%', height: 160, alignItems: 'center', justifyContent: 'center' },
});
