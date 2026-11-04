/**
 * Ecran blocant, nedismisabil — afișat în loc de <Stack> în root layout
 * când lib/update-gate.ts detectează o versiune instalată sub minimul
 * setat de admin în /admin/setari. Nu există buton "mai târziu".
 */
import React from 'react';
import { View, Text, Pressable, Linking, SafeAreaView } from 'react-native';
import { useAppTheme } from './theme-provider';

type Props = {
  message: string;
  storeUrl: string;
};

export function UpdateRequiredScreen({ message, storeUrl }: Props) {
  const t = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🔄</Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: t.colors.text,
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          Actualizare necesară
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.colors.textMuted,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 28,
          }}
        >
          {message}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(storeUrl).catch(() => {})}
          style={{
            backgroundColor: t.colors.primary,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: t.colors.textInverse, fontWeight: '700', fontSize: 15 }}>
            Actualizează acum
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
