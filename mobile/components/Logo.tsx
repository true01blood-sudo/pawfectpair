/**
 * Logo PetCare — inline SVG paw + text, no PNG background issues.
 * variant: 'color' = orange paw on transparent, 'white' = white, 'black' = dark
 */
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'color' | 'white' | 'black';
}

const PAW_COLOR = {
  color: '#FF6B2D',
  white: '#FFFFFF',
  black: '#111827',
} as const;

const TEXT_COLOR = {
  color: '#111827',
  white: '#FFFFFF',
  black: '#111827',
} as const;

export function Logo({ size = 80, showText = true, variant = 'color' }: LogoProps) {
  const pawColor = PAW_COLOR[variant];
  const textColor = TEXT_COLOR[variant];
  const iconSize = showText ? size * 0.6 : size;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
        {/* Main paw pad */}
        <Path
          d="M50 35 C38 35 28 45 28 57 C28 68 36 78 50 80 C64 78 72 68 72 57 C72 45 62 35 50 35Z"
          fill={pawColor}
        />
        {/* Top-left toe */}
        <Circle cx="30" cy="25" r="9" fill={pawColor} />
        {/* Top-right toe */}
        <Circle cx="70" cy="25" r="9" fill={pawColor} />
        {/* Mid-left toe */}
        <Circle cx="20" cy="42" r="7" fill={pawColor} />
        {/* Mid-right toe */}
        <Circle cx="80" cy="42" r="7" fill={pawColor} />
      </Svg>
      {showText && (
        <Text style={{
          color: textColor,
          fontSize: size * 0.22,
          fontWeight: '700',
          marginTop: size * 0.06,
          letterSpacing: 0.3,
        }}>
          PetCare
        </Text>
      )}
    </View>
  );
}
