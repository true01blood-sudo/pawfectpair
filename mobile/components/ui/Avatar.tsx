import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme-provider';
import { initials } from '@pawfectpair/shared';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const t = useAppTheme();
  const fontSize = size * 0.4;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.surfaceAlt }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[
      styles.fallback,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.primaryLight },
    ]}>
      <Text style={{ color: t.colors.primaryDark, fontSize, fontFamily: t.typography.fontFamilyBold }}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
