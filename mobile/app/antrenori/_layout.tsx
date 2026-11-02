/** Layout pentru grupa /antrenori/ — header cu back button */
import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';

export default function AntrenoriLayout() {
  const t = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: t.colors.background },
        headerTintColor: t.colors.text,
        headerTitleStyle: { fontFamily: t.typography.fontFamilyBold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    />
  );
}
