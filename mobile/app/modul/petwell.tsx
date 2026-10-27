/**
 * Ecran PetWell — sănătate & asistent triaj simptome.
 *
 * Funcționalități MVP:
 * - Dashboard sănătate per animal: următoarele vaccinări/control
 *   (din fișa medicală existentă), ultimele înregistrări, grafic greutate
 * - TRIAJ simptome (motor local, fără server): selecție multiplă din
 *   24 simptome grupate pe categorii → nivel risc (calm/monitor/urgent/
 *   emergency) + recomandări + disclaimer „nu înlocuiește veterinarul"
 * - CTA rapid către PetSOS pentru urgențe reale
 *
 * Notă medicală: motorul este de ORIENTARE (triage), bazat pe reguli
 * generale; nu pune diagnostice și nu înlocuiește consultul veterinar.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView } from '../../components/ui';
import { WeightChart } from '../../components/medical/WeightChart';
import { useMyPets } from '../../hooks/usePets';
import { useMedicalRecords, useUpcomingRecords, useWeightLogs } from '../../hooks/useMedical';
import { daysUntil } from '@pawfectpair/shared';
import {
  SYMPTOMS,
  triageSymptoms,
  ageRiskHint,
  type SymptomCategory,
  type TriageLevel,
  type Symptom,
} from '@pawfectpair/shared';

// ============================================================
// Meta-ui triaj
// ============================================================

const LEVEL_STYLE: Record<TriageLevel, { color: string; icon: string }> = {
  emergency: { color: '#DC2626', icon: 'alert-circle' },
  urgent: { color: '#EA580C', icon: 'warning' },
  monitor: { color: '#CA8A04', icon: 'eye' },
  calm: { color: '#16A34A', icon: 'checkmark-circle' },
};

const CATEGORIES: SymptomCategory[] = [
  'general',
  'digestive',
  'respiratory',
  'skin',
  'urinary',
  'behavior',
];

const CATEGORY_EMOJI: Record<SymptomCategory, string> = {
  general: '🐾',
  digestive: '🍖',
  respiratory: '💨',
  skin: '🧴',
  urinary: '💧',
  behavior: '🧠',
};

// ============================================================
// Ecran
// ============================================================

export default function PetWellScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  // --- animal selectat ---
  const { data: pets, isLoading: petsLoading } = useMyPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const petId = selectedPetId ?? pets?.[0]?.id ?? undefined;
  const pet = pets?.find((p) => p.id === petId);

  // --- fișă medicală & greutate (refolosite din MVP) ---
  const { data: upcoming } = useUpcomingRecords();
  const { data: records } = useMedicalRecords(petId ?? '');
  const { data: weightLogs } = useWeightLogs(petId ?? '');

  const petUpcoming = useMemo(
    () => (upcoming ?? []).filter((r) => r.pet_id === petId).slice(0, 3),
    [upcoming, petId]
  );
  const petRecords = useMemo(() => (records ?? []).slice(0, 3), [records]);
  const lastWeight = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return null;
    const sorted = [...weightLogs].sort(
      (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
    );
    return sorted[0];
  }, [weightLogs]);

  // --- triaj ---
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [result, setResult] = useState<ReturnType<typeof triageSymptoms> | null>(null);
  const [activeCategory, setActiveCategory] = useState<SymptomCategory>('general');

  const ageHint = ageRiskHint(pet?.birth_date ? (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 86_400_000) : null);

  const toggleSymptom = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedSymptoms((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setResult(null); // resetăm rezultatul la schimbarea selecției
      return next;
    });
  };

  const onAnalyze = () => {
    if (selectedSymptoms.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setResult(triageSymptoms(selectedSymptoms));
  };

  const symptomsInCategory = useMemo(() => SYMPTOMS.filter((s) => s.category === activeCategory), [activeCategory]);

  // ================= STĂRI SIMPLE =================

  if (petsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('petwell.title') }} />
        <StateView loading />
      </SafeAreaView>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('petwell.title') }} />
        <StateView emoji="🩺" title={t('petwell.noPets')} description={t('petwell.noPetsHint')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('petwell.title') }} />

      {/* Selector animal */}
      <View style={[styles.petRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {t('petwell.pickPet')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {pets.map((p) => {
            const active = p.id === petId;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelectedPetId(p.id);
                  setSelectedSymptoms([]);
                  setResult(null);
                }}
                style={[styles.petChip, { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border }]}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* ============ SUMAR SĂNĂTATE ============ */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
              {t('petwell.healthSummary', { name: pet?.name ?? '' })}
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryTile
              icon="medical"
              color={theme.colors.primary}
              value={petUpcoming.length > 0 ? String(petUpcoming.length) : '—'}
              label={t('petwell.upcomingCount')}
              theme={theme}
            />
            <SummaryTile
              icon="scale"
              color={theme.colors.success}
              value={lastWeight ? `${lastWeight.weight_kg} kg` : '—'}
              label={t('petwell.lastWeight')}
              theme={theme}
            />
            <SummaryTile
              icon="clipboard"
              color={theme.colors.accent}
              value={records ? String(records.length) : '0'}
              label={t('petwell.recordsCount')}
              theme={theme}
            />
          </View>

          {ageHint ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 8 }}>
              {ageHint === 'senior' ? `🎂 ${t('petwell.seniorHint')}` : `🍼 ${t('petwell.youngHint')}`}
            </Text>
          ) : null}
        </Card>

        {/* Următoarele evenimente */}
        {petUpcoming.length > 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
              {t('petwell.upcomingSection')}
            </Text>
            {petUpcoming.map((r) => {
              const d = daysUntil(r.due_date ?? r.record_date);
              const soon = d <= 7;
              return (
                <Card key={r.id}>
                  <View style={styles.upcomingRow}>
                    <Ionicons name={soon ? 'time' : 'calendar-outline'} size={18} color={soon ? theme.colors.danger : theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        {r.type} · {r.due_date ?? r.record_date}
                      </Text>
                    </View>
                    <Text style={{ color: soon ? theme.colors.danger : theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>
                      {d <= 0 ? t('petwell.dueNow') : t('petwell.inDays', { count: d })}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}

        {/* Grafic greutate */}
        {weightLogs && weightLogs.length >= 2 ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
              {t('petwell.weightSection')}
            </Text>
            <WeightChart logs={weightLogs} />
          </View>
        ) : null}

        {/* Ultimele înregistrări */}
        {petRecords.length > 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
              {t('petwell.recentSection')}
            </Text>
            {petRecords.map((r) => (
              <Card key={r.id}>
                <View style={styles.upcomingRow}>
                  <Ionicons name="medkit-outline" size={18} color={theme.colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                      {r.type} · {r.record_date}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* ============ TRIAJ SIMPTOME ============ */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
              🧠 {t('petwell.triageTitle')}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
            {t('petwell.triageIntro')}
          </Text>

          {/* categorii */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            {CATEGORIES.map((c) => {
              const active = c === activeCategory;
              return (
                <Pressable
                  key={c}
                  onPress={() => setActiveCategory(c)}
                  style={[styles.catChip, { backgroundColor: active ? theme.colors.primaryLight : theme.colors.surfaceAlt, borderColor: active ? theme.colors.primary : theme.colors.border }]}
                >
                  <Text style={{ fontSize: 12 }}>{CATEGORY_EMOJI[c]}</Text>
                  <Text style={{ color: active ? theme.colors.primaryDark : theme.colors.text, fontSize: 11, fontWeight: '700' }}>
                    {t(`petwell.cat_${c}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* simptome */}
          <View style={styles.symptomWrap}>
            {symptomsInCategory.map((s: Symptom) => {
              const active = selectedSymptoms.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggleSymptom(s.id)}
                  style={[styles.symptomChip, { backgroundColor: active ? (s.redFlag ? theme.colors.danger : theme.colors.primaryLight) : theme.colors.surfaceAlt, borderColor: active ? (s.redFlag ? theme.colors.danger : theme.colors.primary) : theme.colors.border }]}
                >
                  <Text style={{ fontSize: 13 }}>{s.emoji}</Text>
                  <Text style={{ color: active ? (s.redFlag ? '#fff' : theme.colors.primaryDark) : theme.colors.text, fontSize: 11, fontWeight: '700' }}>
                    {t(`petwell.sym_${s.id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedSymptoms.length > 0 ? (
            <Button
              title={t('petwell.analyze', { count: selectedSymptoms.length })}
              onPress={onAnalyze}
              style={{ marginTop: 14 }}
              fullWidth
            />
          ) : (
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 10 }}>
              {t('petwell.pickSome')}
            </Text>
          )}

          {/* rezultat */}
          {result ? (
            <View style={[styles.resultBox, { backgroundColor: LEVEL_STYLE[result.level].color + '18', borderColor: LEVEL_STYLE[result.level].color }]}>
              <View style={styles.resultHeader}>
                <Ionicons name={LEVEL_STYLE[result.level].icon as 'alert-circle'} size={22} color={LEVEL_STYLE[result.level].color} />
                <Text style={{ color: LEVEL_STYLE[result.level].color, fontSize: 16, fontWeight: '800' }}>
                  {t(`petwell.level_${result.level}`)}
                </Text>
                <View style={{ marginLeft: 'auto' }}>
                  <Text style={{ color: LEVEL_STYLE[result.level].color, fontSize: 12, fontWeight: '700' }}>
                    {result.score}/100
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                {result.adviceKeys.map((k) => (
                  <Text key={k} style={{ color: theme.colors.text, fontSize: 13, lineHeight: 19 }}>
                    • {t(`petwell.${k}`)}
                  </Text>
                ))}
              </View>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 10 }}>
                {t('petwell.disclaimer')}
              </Text>
              {result.level === 'emergency' || result.level === 'urgent' ? (
                <Button
                  title={t('petwell.goSos')}
                  variant="danger"
                  size="sm"
                  style={{ marginTop: 12 }}
                  onPress={() => router.push('/modul/petsos')}
                />
              ) : null}
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// Tile sumar
// ============================================================

function SummaryTile({
  icon,
  color,
  value,
  label,
  theme,
}: {
  icon: 'medical' | 'scale' | 'clipboard';
  color: string;
  value: string;
  label: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.colors.surfaceAlt }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 4 }}>{value}</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ============================================================
// Stiluri
// ============================================================

const styles = StyleSheet.create({
  petRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  petChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 160,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  symptomWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  resultBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
