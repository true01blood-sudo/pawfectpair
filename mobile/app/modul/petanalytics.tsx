/**
 * Modulul PetAnalytics — analize predictive locale.
 * Regresie liniară pe greutate + predicții 30/60/90 zile, rată de
 * completare planner, activitate antrenament, frecvență medicală și
 * scor compozit de sănătate. TOTUL calculat pe dispozitiv.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Card, StateView } from '../../components/ui';
import {
  weightTrend,
  plannerStats,
  trainingStats,
  medicalStats,
  healthScore,
  healthScoreLevel,
  type WeightTrend,
  type HealthScore,
} from '@pawfectpair/shared';
import { useMyPets } from '../../hooks/usePets';
import { useWeightLogs, useMedicalRecords } from '../../hooks/useMedical';
import { usePlannerTasks } from '../../hooks/usePlanner';
import { useTrainingSessions } from '../../hooks/useTraining';

type TFn = ReturnType<typeof useTranslation>['t'];

function trendEmoji(direction: WeightTrend['direction']): string {
  switch (direction) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'stable':
      return '➡️';
    default:
      return '❔';
  }
}

/** Mapare MedicalType → cheie i18n sigură (fără diacritice în cheie). */
const MEDICAL_TYPE_KEY: Record<string, string> = {
  vaccinare: 'vaccinare',
  tratament: 'tratament',
  'intervenție': 'interventie',
  alergie: 'alergie',
  control: 'control',
  deparazitare: 'deparazitare',
  altul: 'altul',
};

function fmtKg(n: number | null): string {
  return n == null ? '—' : `${n} kg`;
}

export default function PetAnalyticsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const { data: pets = [] } = useMyPets();
  const [petId, setPetId] = useState<string | null>(null);
  const activePetId = petId ?? pets[0]?.id ?? '';

  const weightQ = useWeightLogs(activePetId);
  const medicalQ = useMedicalRecords(activePetId);
  const plannerQ = usePlannerTasks(activePetId || undefined, true);
  const trainingQ = useTrainingSessions({ petId: activePetId || null });

  const loading =
    weightQ.isLoading || medicalQ.isLoading || plannerQ.isLoading || trainingQ.isLoading;
  const isError = weightQ.isError || medicalQ.isError || plannerQ.isError || trainingQ.isError;

  const weight = useMemo(() => weightTrend(weightQ.data ?? []), [weightQ.data]);
  const planner = useMemo(() => plannerStats(plannerQ.data ?? []), [plannerQ.data]);
  const training = useMemo(() => trainingStats(trainingQ.data ?? []), [trainingQ.data]);
  const medical = useMemo(() => medicalStats(medicalQ.data ?? []), [medicalQ.data]);
  const score: HealthScore = useMemo(
    () => healthScore({ planner, training, medical, weight }),
    [planner, training, medical, weight]
  );
  const level = healthScoreLevel(score.total);
  const levelColor =
    level === 'great' ? colors.success : level === 'good' ? colors.primary : level === 'medium' ? '#F59E0B' : colors.danger;

  const noPets = pets.length === 0;

  const predictions = [30, 60, 90];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>📊 {t('analytics.title')}</Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>{t('analytics.subtitle')}</Text>
        </View>

        {noPets ? (
          <StateView emoji="🐾" title={t('analytics.no_pets_title')} description={t('analytics.no_pets_desc')} />
        ) : (
          <>
            {/* Selector animal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
              {pets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPetId(p.id)}
                  style={[s.chip, { borderColor: colors.border, backgroundColor: (petId ?? pets[0]?.id) === p.id ? colors.primary : colors.surface }]}
                >
                  <Text style={{ color: (petId ?? pets[0]?.id) === p.id ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <StateView loading={loading} error={isError ? t('common.error') : null}>
              {/* Scor sănătate */}
              <Card style={{ marginBottom: 12 }}>
                <View style={s.scoreRow}>
                  <View style={s.scoreCircle}>
                    <Text style={[s.scoreValue, { color: levelColor }]}>{score.total}</Text>
                    <Text style={[s.scoreOf, { color: colors.textMuted }]}>/100</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[s.scoreTitle, { color: colors.text }]}>{t(`analytics.level_${level}`)}</Text>
                    {score.parts.map((part) => (
                      <View key={part.label} style={s.partRow}>
                        <Text style={[s.partLabel, { color: colors.textMuted }]}>
                          {t(`analytics.part_${part.label}`)}
                        </Text>
                        <View style={[s.partTrack, { backgroundColor: colors.surfaceAlt }]}>
                          <View
                            style={[
                              s.partFill,
                              { width: `${(part.score / part.max) * 100}%`, backgroundColor: levelColor },
                            ]}
                          />
                        </View>
                        <Text style={[s.partValue, { color: colors.textMuted }]}>
                          {part.score}/{part.max}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>

              {/* Trend greutate + predicții */}
              <Card style={{ marginBottom: 12 }}>
                <Text style={[s.cardTitle, { color: colors.text }]}>
                  {trendEmoji(weight.direction)} {t('analytics.weight_title')}
                </Text>
                {weight.direction === 'insufficient' ? (
                  <Text style={[s.cardText, { color: colors.textMuted }]}>
                    {t('analytics.weight_insufficient')}
                  </Text>
                ) : (
                  <>
                    <Text style={[s.cardText, { color: colors.text }]}>
                      {t(`analytics.trend_${weight.direction}`, { n: Math.abs(weight.weeklyChangeKg) })}
                    </Text>
                    <Text style={[s.cardMeta, { color: colors.textMuted }]}>
                      {t('analytics.weight_first_last', { first: fmtKg(weight.firstKg), last: fmtKg(weight.lastKg) })}
                      {weight.confidence != null ? ` · ${t('analytics.confidence', { n: Math.round(weight.confidence * 100) })}` : ''}
                    </Text>
                    <View style={s.predRow}>
                      {predictions.map((d) => {
                        const p = weight.predictedAt(d);
                        return (
                          <View key={d} style={[s.predCard, { backgroundColor: colors.surfaceAlt }]}>
                            <Text style={[s.predDays, { color: colors.textMuted }]}>+{d}</Text>
                            <Text style={[s.predValue, { color: colors.text }]}>{fmtKg(p)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </Card>

              {/* Activitate */}
              <Card style={{ marginBottom: 12 }}>
                <Text style={[s.cardTitle, { color: colors.text }]}>🎯 {t('analytics.activity_title')}</Text>
                <View style={s.grid2}>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>{planner.rate}%</Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.planner_rate')}</Text>
                  </View>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>{training.sessions7}</Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.training_7')}</Text>
                  </View>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>{training.minutes7}</Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.minutes_7')}</Text>
                  </View>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>{training.avgPerWeek4w}</Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.avg_week')}</Text>
                  </View>
                </View>
              </Card>

              {/* Medical */}
              <Card style={{ marginBottom: 12 }}>
                <Text style={[s.cardTitle, { color: colors.text }]}>🩺 {t('analytics.medical_title')}</Text>
                <View style={s.grid2}>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>{medical.last90}</Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.medical_90')}</Text>
                  </View>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>{medical.upcoming}</Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.medical_upcoming')}</Text>
                  </View>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValue, { color: colors.text }]}>
                      {medical.daysSinceLast ?? '—'}
                    </Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.days_since')}</Text>
                  </View>
                  <View style={[s.gridCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[s.gridValueSmall, { color: colors.text }]}>
                      {medical.topType ? t(`medical.type_${MEDICAL_TYPE_KEY[medical.topType] ?? 'altul'}`) : '—'}
                    </Text>
                    <Text style={[s.gridLabel, { color: colors.textMuted }]}>{t('analytics.top_type')}</Text>
                  </View>
                </View>
              </Card>

              {/* Disclaimer */}
              <Text style={[s.disclaimer, { color: colors.textMuted }]}>
                ℹ️ {t('analytics.disclaimer')}
              </Text>
            </StateView>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  container: { maxWidth: 720, width: '100%', alignSelf: 'center', padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  chipsRow: { marginBottom: 12, flexGrow: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: { width: 92, height: 92, borderRadius: 46, borderWidth: 4, borderColor: 'rgba(249,115,22,0.25)', alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 30, fontWeight: '900' },
  scoreOf: { fontSize: 11 },
  scoreTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  partRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  partLabel: { width: 92, fontSize: 11 },
  partTrack: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden', marginHorizontal: 8 },
  partFill: { height: '100%', borderRadius: 999 },
  partValue: { width: 40, fontSize: 11, textAlign: 'right' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardText: { fontSize: 14, fontWeight: '600' },
  cardMeta: { fontSize: 12, marginTop: 4 },
  predRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  predCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  predDays: { fontSize: 11 },
  predValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCard: { flexGrow: 1, minWidth: '45%', borderRadius: 12, padding: 12, alignItems: 'center' },
  gridValue: { fontSize: 20, fontWeight: '800' },
  gridValueSmall: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  gridLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  disclaimer: { fontSize: 12, lineHeight: 17, marginTop: 4 },
});
