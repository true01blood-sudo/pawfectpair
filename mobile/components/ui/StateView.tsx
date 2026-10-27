import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../theme-provider';

interface StateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  /** Emoji mare deasupra titlului (stări personalizate) */
  emoji?: string;
  /** Titlu principal (pentru stări goale personalizate) */
  title?: string;
  /** Descriere sub titlu */
  description?: string;
  children?: React.ReactNode;
}

export function StateView({
  loading,
  error,
  empty,
  emptyText = 'Nu există date',
  emoji,
  title,
  description,
  children,
}: StateProps) {
  const t = useAppTheme();
  if (loading) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <ActivityIndicator color={t.colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <Text style={{ color: t.colors.danger, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }
  if (empty || emoji || title) {
    return (
      <View style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}>
        {emoji && <Text style={{ fontSize: 44, marginBottom: 8 }}>{emoji}</Text>}
        <Text
          style={{
            color: t.colors.text,
            fontSize: 16,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {title ?? emptyText}
        </Text>
        {(description || (!title && !emoji)) && (
          <Text style={{ color: t.colors.textMuted, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
            {description ?? emptyText}
          </Text>
        )}
      </View>
    );
  }
  return <>{children}</>;
}
