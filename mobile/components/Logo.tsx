/**
 * Componenta Logo Pet Care Services.
 * Folosește imaginea descărcată din assets/images/.
 */
import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from './theme-provider';

interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'color' | 'white' | 'black';
}

export function Logo({ size = 80, showText = true, variant = 'color' }: LogoProps) {
  const theme = useAppTheme();
  const source =
    variant === 'white'
      ? require('../assets/images/logo-white.png')
      : variant === 'black'
      ? require('../assets/images/logo-black.png')
      : require('../assets/images/logo-color.png');

  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={source}
        style={{ width: size, height: size, resizeMode: 'contain' }}
        accessibilityLabel="Pet Care Services logo"
      />
      {showText && (
        <Text style={[styles.text, { color: theme.colors.text }]}>Pet Care Services</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
