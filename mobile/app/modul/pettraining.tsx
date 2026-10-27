/**
 * Modulul PetTraining — dresaj & stimulare cognitivă.
 * Abilități/comezi per animal cu progres spre stăpânire + sesiuni
 * de antrenament (durată, rating, note) și sumar activitate.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card, StateView } from '../../components/ui';
import {
  TRAINING_CATEGORIES,
  TRAINING_CATEGORY_EMOJI,
  type TrainingCategory,
  type TrainingSkill,
  type TrainingSkillStatus,
} from '@pawfectpair/shared';
import {
  trainingProgress,
  sortTrainingSkills,
  sortTrainingSessions,
  trainingDashboard,
  suggestNextDuration,
} from '@pawfectpair/shared';
import { TrainingSkillSchema } from '@pawfectpair/shared';
import {
  useTrainingSkills,
  useTrainingSessions,
  useTrainingRefreshOnFocus,
  useCreateTrainingSkill,
  useUpdateTrainingSkill,
  useSetTrainingSkillStatus,
  useDeleteTrainingSkill,
  useCreateTrainingSession,
} from '../../hooks/useTraining';
import { useMyPets } from '../../hooks/usePets';

type TFn = ReturnType<typeof useTranslation>['t'];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function fmtDateTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

const RATING_EMOJI = ['😞', '😕', '🙂', '😊', '🤩'];

interface SkillFormState {
  name: string;
  category: TrainingCategory;
  difficulty: number;
  target_sessions: string;
}

function emptySkillForm(): SkillFormState {
  return { name: '', category: 'basic', difficulty: 2, target_sessions: '10' };
}

export default function PetTrainingScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const locale = i18n.language?.slice(0, 2) ?? 'ro';

  useTrainingRefreshOnFocus();

  const { data: pets = [] } = useMyPets();
  const [petId, setPetId] = useState<string | null>(null);
  const [category, setCategory] = useState<TrainingCategory | null>(null);

  const { data: skills = [], isLoading, isError } = useTrainingSkills(
    { petId, category },
    true
  );
  const { data: sessions = [] } = useTrainingSessions({ petId });

  const createSkill = useCreateTrainingSkill();
  const updateSkill = useUpdateTrainingSkill();
  const setSkillStatus = useSetTrainingSkillStatus();
  const deleteSkill = useDeleteTrainingSkill();
  const createSession = useCreateTrainingSession();

  const dash = useMemo(() => trainingDashboard(skills, sessions), [skills, sessions]);
  const sortedSkills = useMemo(() => sortTrainingSkills(skills, sessions), [skills, sessions]);
  const recentSessions = useMemo(() => sortTrainingSessions(sessions).slice(0, 10), [sessions]);

  // Modal skill
  const [skillModal, setSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<TrainingSkill | null>(null);
  const [skillForm, setSkillForm] = useState<SkillFormState>(emptySkillForm());
  const [skillErr, setSkillErr] = useState<string | null>(null);

  // Modal sesiune
  const [sessionSkill, setSessionSkill] = useState<TrainingSkill | null>(null);
  const [duration, setDuration] = useState('10');
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState('');
  const [sessionErr, setSessionErr] = useState<string | null>(null);

  const openNewSkill = () => {
    haptic();
    setEditingSkill(null);
    setSkillForm(emptySkillForm());
    setSkillErr(null);
    setSkillModal(true);
  };

  const openEditSkill = (s: TrainingSkill) => {
    haptic();
    setEditingSkill(s);
    setSkillForm({
      name: s.name,
      category: s.category,
      difficulty: s.difficulty,
      target_sessions: String(s.target_sessions),
    });
    setSkillErr(null);
    setSkillModal(true);
  };

  const saveSkill = () => {
    setSkillErr(null);
    const parsed = TrainingSkillSchema.safeParse({
      pet_id: petId || pets[0]?.id || '',
      name: skillForm.name,
      category: skillForm.category,
      difficulty: skillForm.difficulty,
      target_sessions: parseInt(skillForm.target_sessions, 10) || 0,
    });
    if (!parsed.success) {
      setSkillErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    const input = {
      pet_id: parsed.data.pet_id,
      name: parsed.data.name,
      category: parsed.data.category as TrainingCategory,
      difficulty: parsed.data.difficulty,
      target_sessions: parsed.data.target_sessions,
    };
    const op = editingSkill ? updateSkill.mutateAsync({ id: editingSkill.id, input }) : createSkill.mutateAsync(input);
    op
      .then(() => {
        setSkillModal(false);
        haptic();
      })
      .catch((e: Error) => setSkillErr(e.message));
  };

  const openSession = (s: TrainingSkill) => {
    haptic();
    setSessionSkill(s);
    setDuration(String(suggestNextDuration(
      sessions.filter((x) => x.skill_id === s.id)
    )));
    setRating(4);
    setNotes('');
    setSessionErr(null);
  };

  const saveSession = () => {
    if (!sessionSkill) return;
    setSessionErr(null);
    const minutes = parseInt(duration, 10) || 0;
    if (minutes < 1 || minutes > 180) {
      setSessionErr(t('training.err_duration'));
      return;
    }
    createSession
      .mutateAsync({
        input: { skill_id: sessionSkill.id, duration_minutes: minutes, rating, notes: notes || null },
        petId: sessionSkill.pet_id,
      })
      .then(() => {
        setSessionSkill(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setSessionErr(e.message));
  };

  const confirmDeleteSkill = (s: TrainingSkill) => {
    RNAlert.alert(t('training.delete_title', { name: s.name }), t('training.delete_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteSkill.mutate(s.id),
      },
    ]);
  };

  const cycleStatus = (s: TrainingSkill) => {
    haptic();
    const next: TrainingSkillStatus =
      s.status === 'learning' ? 'mastered' : s.status === 'mastered' ? 'paused' : 'learning';
    setSkillStatus.mutate({ id: s.id, status: next });
  };

  const statusColor = (st: TrainingSkillStatus): string =>
    st === 'mastered' ? colors.success : st === 'paused' ? colors.textMuted : colors.primary;

  const hasPets = pets.length > 0;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Antet */}
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>🎓 {t('training.title')}</Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>{t('training.subtitle')}</Text>
        </View>

        {/* Sumar */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryValue, { color: colors.text }]}>{dash.totalSessions}</Text>
            <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('training.stat_sessions')}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryValue, { color: colors.text }]}>{dash.totalMinutes}</Text>
            <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('training.stat_minutes')}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryValue, { color: colors.text }]}>
              {dash.masteredCount}/{dash.masteredCount + dash.learningCount + dash.pausedCount || 0}
            </Text>
            <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('training.stat_mastered')}</Text>
          </View>
        </View>
        {dash.sessionsThisWeek > 0 && (
          <Text style={[s.weekNote, { color: colors.textMuted }]}>
            🔥 {t('training.week_note', { n: dash.sessionsThisWeek })}
          </Text>
        )}

        {/* Selector animal */}
        {hasPets && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
            <TouchableOpacity
              onPress={() => { haptic(); setPetId(null); }}
              style={[s.chip, { borderColor: colors.border, backgroundColor: !petId ? colors.primary : colors.surface }]}
            >
              <Text style={{ color: !petId ? '#FFFFFF' : colors.text, fontSize: 13 }}>🐾 {t('training.all_pets')}</Text>
            </TouchableOpacity>
            {pets.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => { haptic(); setPetId(p.id); }}
                style={[s.chip, { borderColor: colors.border, backgroundColor: petId === p.id ? colors.primary : colors.surface }]}
              >
                <Text style={{ color: petId === p.id ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Chips categorii */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
          <TouchableOpacity
            onPress={() => { haptic(); setCategory(null); }}
            style={[s.chip, { borderColor: colors.border, backgroundColor: !category ? colors.primaryDark : colors.surface }]}
          >
            <Text style={{ color: !category ? '#FFFFFF' : colors.text, fontSize: 13 }}>{t('training.cat_all')}</Text>
          </TouchableOpacity>
          {TRAINING_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => { haptic(); setCategory(c); }}
              style={[s.chip, { borderColor: colors.border, backgroundColor: category === c ? colors.primaryDark : colors.surface }]}
            >
              <Text style={{ color: category === c ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                {TRAINING_CATEGORY_EMOJI[c]} {t(`training.cat_${c}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Conținut */}
        {!hasPets ? (
          <StateView
            emoji="🐾"
            title={t('training.no_pets_title')}
            description={t('training.no_pets_desc')}
          />
        ) : (
          <StateView
            loading={isLoading}
            error={isError ? t('common.error') : null}
            empty={!isError && sortedSkills.length === 0}
            emoji="🎓"
            title={t('training.none_title')}
            description={t('training.none_desc')}
          >
            {sortedSkills.map((skill) => {
              const prog = trainingProgress(skill, sessions);
              return (
                <Card key={skill.id} style={{ marginBottom: 12 }}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => openEditSkill(skill)}>
                    <View style={s.skillHead}>
                      <Text style={{ fontSize: 22 }}>{TRAINING_CATEGORY_EMOJI[skill.category]}</Text>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[s.skillName, { color: colors.text }]} numberOfLines={1}>
                          {skill.name}
                        </Text>
                        <Text style={[s.skillMeta, { color: colors.textMuted }]}>
                          {t(`training.cat_${skill.category}`)} · {'⭐'.repeat(skill.difficulty)}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => cycleStatus(skill)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <View style={[s.statusBadge, { backgroundColor: statusColor(skill.status) + '22', borderColor: statusColor(skill.status) }]}>
                          <Text style={[s.statusText, { color: statusColor(skill.status) }]}>
                            {t(`training.status_${skill.status}`)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Bară progres */}
                    <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[s.progressFill, { width: `${prog.percent}%`, backgroundColor: statusColor(skill.status) }]} />
                    </View>
                    <View style={s.progressMeta}>
                      <Text style={[s.metaText, { color: colors.textMuted }]}>
                        {t('training.progress', { done: prog.sessionsCount, target: prog.targetSessions })} · {prog.percent}%
                      </Text>
                      <Text style={[s.metaText, { color: colors.textMuted }]}>
                        {prog.avgRating > 0 ? `${t('training.avg_rating')}: ${prog.avgRating.toFixed(1)}` : ''}
                        {prog.lastPracticedAt ? ` · ${fmtDateTime(prog.lastPracticedAt, locale)}` : ''}
                      </Text>
                    </View>
                    {prog.stale && (
                      <Text style={[s.staleNote, { color: colors.danger }]}>
                        ⏳ {t('training.stale_note')}
                      </Text>
                    )}

                    <View style={s.skillActions}>
                      <View style={{ flex: 1 }}>
                        <Button title={t('training.log_session')} size="sm" onPress={() => openSession(skill)} />
                      </View>
                      <TouchableOpacity onPress={() => confirmDeleteSkill(skill)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ color: colors.danger, fontSize: 13 }}>{t('common.delete')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </StateView>
        )}

        {/* Sesiuni recente */}
        {recentSessions.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{t('training.recent_sessions')}</Text>
            {recentSessions.map((ses) => {
              const skill = skills.find((x) => x.id === ses.skill_id);
              return (
                <View key={ses.id} style={[s.sessionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 18 }}>{skill ? TRAINING_CATEGORY_EMOJI[skill.category] : '🎓'}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                      {skill?.name ?? t('training.deleted_skill')}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {ses.duration_minutes} min · {fmtDateTime(ses.practiced_at, locale)}
                    </Text>
                    {ses.notes ? (
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                        {ses.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 16 }}>{RATING_EMOJI[Math.min(5, Math.max(1, ses.rating)) - 1]}</Text>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {hasPets && (
        <TouchableOpacity
          style={[s.fab, { backgroundColor: colors.primary }]}
          onPress={openNewSkill}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 28, lineHeight: 32 }}>＋</Text>
        </TouchableOpacity>
      )}

      {/* Modal abilitate */}
      <Modal visible={skillModal} transparent animationType="slide" onRequestClose={() => setSkillModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSkillModal(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editingSkill ? t('training.edit_skill') : t('training.new_skill')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label={t('training.f_name')}
                placeholder={t('training.f_name_ph')}
                value={skillForm.name}
                onChangeText={(v) => setSkillForm((f) => ({ ...f, name: v }))}
                maxLength={60}
              />
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('training.f_category')}</Text>
              <View style={s.wrapRow}>
                {TRAINING_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { haptic(); setSkillForm((f) => ({ ...f, category: c })); }}
                    style={[s.chip, { borderColor: colors.border, backgroundColor: skillForm.category === c ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: skillForm.category === c ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                      {TRAINING_CATEGORY_EMOJI[c]} {t(`training.cat_${c}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('training.f_difficulty')}</Text>
              <View style={s.wrapRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => { haptic(); setSkillForm((f) => ({ ...f, difficulty: n })); }}
                    style={[s.starBtn, { borderColor: colors.border }]}
                  >
                    <Text style={{ fontSize: 18 }}>{skillForm.difficulty >= n ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('training.f_target')}
                placeholder="10"
                value={skillForm.target_sessions}
                onChangeText={(v) => setSkillForm((f) => ({ ...f, target_sessions: v.replace(/[^0-9]/g, '') }))}
                maxLength={3}
                keyboardType="number-pad"
              />
              {skillErr ? <Text style={[s.formError, { color: colors.danger }]}>{skillErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setSkillModal(false)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={editingSkill ? t('common.save') : t('training.add_skill')}
                    size="sm"
                    onPress={saveSkill}
                    loading={createSkill.isPending || updateSkill.isPending}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal sesiune */}
      <Modal visible={!!sessionSkill} transparent animationType="slide" onRequestClose={() => setSessionSkill(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSessionSkill(null)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              🎯 {t('training.session_for', { name: sessionSkill?.name ?? '' })}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label={t('training.f_duration')}
                placeholder="10"
                value={duration}
                onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
                maxLength={3}
                keyboardType="number-pad"
              />
              <View style={s.wrapRow}>
                {[5, 10, 15, 30].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => { haptic(); setDuration(String(n)); }}
                    style={[s.chip, { borderColor: colors.border, backgroundColor: duration === String(n) ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: duration === String(n) ? '#FFFFFF' : colors.text, fontSize: 13 }}>{n} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('training.f_rating')}</Text>
              <View style={s.wrapRow}>
                {RATING_EMOJI.map((e, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => { haptic(); setRating(idx + 1); }}
                    style={[s.starBtn, { borderColor: rating === idx + 1 ? colors.primary : colors.border, borderWidth: rating === idx + 1 ? 2 : 1 }]}
                  >
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('training.f_notes')}
                placeholder={t('training.f_notes_ph')}
                value={notes}
                onChangeText={setNotes}
                maxLength={500}
                multiline
              />
              {sessionErr ? <Text style={[s.formError, { color: colors.danger }]}>{sessionErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setSessionSkill(null)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={t('training.save_session')}
                    size="sm"
                    onPress={saveSession}
                    loading={createSession.isPending}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  container: { maxWidth: 720, width: '100%', alignSelf: 'center', padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  summaryCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  weekNote: { fontSize: 12, marginBottom: 8 },
  chipsRow: { marginBottom: 8, flexGrow: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  skillHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  skillName: { fontSize: 16, fontWeight: '700' },
  skillMeta: { fontSize: 12, marginTop: 1 },
  statusBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', gap: 4 },
  metaText: { fontSize: 11 },
  staleNote: { fontSize: 12, marginTop: 6 },
  skillActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  fieldLabel: { fontSize: 12, marginBottom: 6, marginTop: 2 },
  starBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 4 },
  formError: { fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
});
