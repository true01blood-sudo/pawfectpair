import React from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useAppTheme } from './theme-provider';

type Props = {
  onRetry: () => void;
  failed: boolean;
};

export function BiometricLockScreen({ onRetry, failed }: Props) {
  const t = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🔒</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.colors.text, textAlign: 'center', marginBottom: 10 }}>
          Aplicație blocată
        </Text>
        <Text style={{ fontSize: 14, color: t.colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
          {failed
            ? 'Nu te-am putut verifica. Încearcă din nou.'
            : 'Deblochează cu amprenta sau Face ID ca să continui.'}
        </Text>
        <Pressable
          onPress={onRetry}
          style={{ backgroundColor: t.colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 }}
        >
          <Text style={{ color: t.colors.textInverse, fontWeight: '700', fontSize: 15 }}>Deblochează</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
