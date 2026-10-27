import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../theme-provider';
import { Card } from '../ui/Card';
import { MEDICAL_TYPE_LABELS, MEDICAL_TYPE_EMOJI, formatDateRO, daysUntil } from '@pawfectpair/shared';
import type { MedicalRecord } from '@pawfectpair/shared';

interface MedicalRecordItemProps {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
}

export function MedicalRecordItem({ record, onDelete }: MedicalRecordItemProps) {
  const t = useAppTheme();
  const days = record.due_date ? daysUntil(record.due_date) : null;
  const upcoming = days !== null && days >= 0 && days <= 30;
  const overdue = days !== null && days < 0;

  return (
    <Card style={{ marginBottom: t.spacing.sm }}>
      <View style={[styles.row, { gap: t.spacing.md }]}>
        <View style={[styles.icon, { backgroundColor: t.colors.primaryLight }]}>
          <Text style={{ fontSize: 22 }}>{MEDICAL_TYPE_EMOJI[record.type]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeMd, fontFamily: t.typography.fontFamilyBold }} numberOfLines={1}>
            {record.title}
          </Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm }}>
            {MEDICAL_TYPE_LABELS[record.type]} · {formatDateRO(record.record_date)}
          </Text>
          {record.due_date && (
            <View style={[styles.chip, {
              backgroundColor: overdue ? t.colors.danger : upcoming ? t.colors.accent : t.colors.surfaceAlt,
              alignSelf: 'flex-start', marginTop: t.spacing.xs,
            }]}>
              <Text style={{
                color: overdue || upcoming ? t.colors.textInverse : t.colors.textMuted,
                fontSize: t.typography.fontSizeXs, fontFamily: t.typography.fontFamilyMedium,
              }}>
                {overdue ? `Scadență expirată (${Math.abs(days!)} zile)` :
                 days === 0 ? 'Scadență astăzi' :
                 days! < 30 ? `Scadență în ${days} zile` :
                 `Scadență: ${formatDateRO(record.due_date)}`}
              </Text>
            </View>
          )}
          {record.notes && (
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm, marginTop: t.spacing.xs }} numberOfLines={2}>
              {record.notes}
            </Text>
          )}
        </View>
        {onDelete && (
          <Pressable onPress={() => onDelete(record.id)} hitSlop={8}>
            <Text style={{ color: t.colors.danger, fontSize: t.typography.fontSizeLg }}>✕</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});
