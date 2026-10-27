import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme-provider';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  leftIcon,
  ...rest
}: ButtonProps) {
  const t = useAppTheme();

  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const fontSize = size === 'sm' ? t.typography.fontSizeSm : size === 'lg' ? t.typography.fontSizeLg : t.typography.fontSizeMd;

  const bg =
    variant === 'primary' ? t.colors.primary :
    variant === 'secondary' ? t.colors.accent :
    variant === 'danger' ? t.colors.danger :
    'transparent';
  const fg =
    variant === 'outline' || variant === 'ghost' ? t.colors.text : t.colors.textInverse;
  const border = variant === 'outline' ? t.colors.primary : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { height, paddingHorizontal: t.spacing.lg, borderRadius: t.radius.md, backgroundColor: bg, borderColor: border, opacity: pressed || disabled ? 0.6 : 1 },
        fullWidth && { width: '100%' },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, { color: fg, fontSize, fontFamily: t.typography.fontFamilyMedium }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  text: { textAlign: 'center' },
});
