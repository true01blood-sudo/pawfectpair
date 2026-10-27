import React from 'react';
import { Text, TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
import { useAppTheme } from '../theme-provider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, helper, leftIcon, style, ...rest }: InputProps) {
  const t = useAppTheme();
  return (
    <View style={{ marginBottom: t.spacing.md }}>
      {label && (
        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm, fontFamily: t.typography.fontFamilyMedium, marginBottom: t.spacing.xs }}>
          {label}
        </Text>
      )}
      <View style={[
        styles.wrap,
        {
          backgroundColor: t.colors.surfaceAlt,
          borderColor: error ? t.colors.danger : t.colors.border,
          borderRadius: t.radius.md,
          paddingHorizontal: t.spacing.md,
        },
      ]}>
        {leftIcon}
        <TextInput
          placeholderTextColor={t.colors.textMuted}
          style={[
            styles.input,
            { color: t.colors.text, fontSize: t.typography.fontSizeMd, flex: 1 },
            style,
          ]}
          {...rest}
        />
      </View>
      {error && <Text style={{ color: t.colors.danger, fontSize: t.typography.fontSizeXs, marginTop: t.spacing.xs }}>{error}</Text>}
      {helper && !error && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs, marginTop: t.spacing.xs }}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderWidth: 1.5 },
  input: { paddingVertical: 12 },
});
