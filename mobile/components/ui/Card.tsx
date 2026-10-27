import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useAppTheme } from '../theme-provider';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: 'sm' | 'md' | 'lg';
}

export function Card({ padded = true, elevated = 'sm', style, children, ...rest }: CardProps) {
  const t = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          padding: padded ? t.spacing.lg : 0,
          borderWidth: 1,
          borderColor: t.colors.border,
          ...(elevated === 'md' ? t.shadow.md : elevated === 'lg' ? t.shadow.lg : t.shadow.sm),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
