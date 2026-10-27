/**
 * Ecran PetPlanner — program de activități & reminder-uri pentru animale.
 *
 * Funcționalități MVP:
 * - Selector animal (sau „Toate") + sumar: de făcut azi / întârziate
 * - Listă grupată: Întârziate → Astăzi → Viitoare → Finalizate
 *   (activate crescător după termen, finalizate la final)
 * - Categorii: hrănire 🍽️, plimbare 🚶, îngrijire ✂️, medicație 💊, alte 📌
 * - Recurență automată: completarea unei activități zilnice/săptămânale
 *   creează instant următoarea apariție (păstrează ora din zi)
 * - Formular modal: titlu, categorie, dată + oră (cu scurtături rapide),
 *   recurență — validat cu PlannerTaskSchema (Zod) înainte de insert
 *
 * Securitate: validare Zod pe toate intrările (@pawfectpair/shared),
 * sanitizare text în queries, RLS pe server (owner-only).
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView, Input } from '../../components/ui';
import { useMyPets } from '../../hooks/usePets';
import {
  usePlannerList,
  useCreatePlannerTask,
  useTogglePlannerTask,
  useDeletePlannerTask,
} from '../../hooks/usePlanner';
import {
  toDateInput,
  groupPlannerTasks,
  PlannerTaskSchema,
  PLANNER_CATEGORIES,
  PLANNER_RECURRENCES,
  PLANNER_CATEGORY_EMOJI,
  type PlannerCategory,
  type PlannerRecurrence,
  type PlannerTask,
  type PlannerBucket,
} from '@pawfectpair/shared';

// ============================================================
// Helpers
// ============================================================

/** Etichetă prietenoasă pentru termen: „Azi 18:00", „Mâine 09:00", „15 mar., 18:00" */
function formatDueLabel(iso: string, t: (k: string) => string, language: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `${t('planner.today')} ${time}`;
  if (diffDays === 1) return `${t('planner.tomorrow')} ${time}`;
  if (diffDays === -1) return `${t('planner.yesterday')} ${time}`;
  const date = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(d);
  return `${date}, ${time}`;
}

const BUCKET_META: Record<PlannerBucket, { emoji: string; colorKey: 'danger' | 'primary' | 'textMuted' | 'success' }> = {
  overdue: { emoji: '🔥', colorKey: 'danger' },
  today: { emoji: '☀️', colorKey: 'primary' },
  upcoming: { emoji: '📆', colorKey: 'textMuted' },
  done: { emoji: '✅', colorKey: 'success' },
};

// ============================================================
// Ecran
// ============================================================

export default function PetPlannerScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();

  // --- date ---
  const { data: pets, isLoading: petsLoading } = useMyPets();
  // null = „Toate animalele"
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const { tasks, isLoading, error, refetch, openToday } = usePlannerList(selectedPetId ?? undefined);

  // --- mutații ---
  const createTask = useCreatePlannerTask();
  const toggleTask = useTogglePlannerTask();
  const deleteTask = useDeletePlannerTask();

  // --- setări UI ---
  const [showDone, setShowDone] = useState(false);

  // --- formular activitate nouă ---
  const [showForm, setShowForm] = useState(false);
  const [formPetId, setFormPetId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PlannerCategory>('feeding');
  const [dateText, setDateText] = useState(() => {
    const d = new Date(Date.now() + 86_400_000);
    return toDateInput(d);
  });
  const [timeText, setTimeText] = useState('09:00');
  const [recurrence, setRecurrence] = useState<PlannerRecurrence>('none');
  const [formError, setFormError] = useState<string | null>(null);

  const overdueCount = useMemo(
    () => (tasks ?? []).filter((x) => !x.done && new Date(x.due_at).getTime() < new Date().setHours(0, 0, 0, 0)).length,
    [tasks]
  );

  // Secțiuni grupate (fără finalizate dacă showDone = false)
  const sections = useMemo(() => {
    const groups = groupPlannerTasks(tasks ?? []);
    return showDone ? groups : groups.filter((g) => g.bucket !== 'done');
  }, [tasks, showDone]);

  // ================= FORM =================

  const resetForm = () => {
    setTitle('');
    setCategory('feeding');
    setRecurrence('none');
    setFormError(null);
    const d = new Date(Date.now() + 86_400_000);
    setDateText(toDateInput(d));
    setTimeText('09:00');
  };

  const openForm = () => {
    setFormPetId(selectedPetId ?? pets?.[0]?.id ?? null);
    resetForm();
    setShowForm(true);
  };

  /** Scurtături: setează dată+oră cu un tap. */
  const applyQuickSlot = (kind: 'now' | 'evening' | 'morning' | 'eveningTomorrow') => {
    const now = new Date();
    const d = new Date(now);
    if (kind === 'now') {
      d.setMinutes(d.getMinutes() + 60);
      setDateText(toDateInput(d));
      setTimeText(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
      return;
    }
    if (kind === 'morning') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (kind === 'eveningTomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(19, 0, 0, 0);
    } else {
      d.setHours(19, 0, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    }
    setDateText(toDateInput(d));
    setTimeText(`${String(d.getHours()).padStart(2, '0')}:00`);
  };

  const onSubmit = async () => {
    setFormError(null);
    const petForTask = formPetId ?? pets?.[0]?.id;
    if (!petForTask) {
      setFormError(t('planner.errorPet'));
      return;
    }
    // validare format dată/oră local
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText.trim())) {
      setFormError(t('planner.errorDate'));
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeText.trim())) {
      setFormError(t('planner.errorTime'));
      return;
    }
    const due = new Date(`${dateText.trim()}T${timeText.trim()}:00`);
    if (Number.isNaN(due.getTime())) {
      setFormError(t('planner.errorDate'));
      return;
    }
    const candidate = {
      pet_id: petForTask,
      title: title.trim(),
      category,
      due_at: due.toISOString(),
      recurrence,
    };
    const parsed = PlannerTaskSchema.safeParse(candidate);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('planner.errorGeneric'));
      return;
    }
    try {
      await createTask.mutateAsync(parsed.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowForm(false);
      resetForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('planner.errorGeneric'));
    }
  };

  const onToggle = (task: PlannerTask) => {
    Haptics.selectionAsync().catch(() => {});
    toggleTask.mutate({ task, done: !task.done });
  };

  const onDelete = (task: PlannerTask) => {
    RNAlert.alert(t('planner.deleteTitle'), t('planner.deleteBody', { title: task.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteTask.mutate(task.id),
      },
    ]);
  };

  // ================= STĂRI SIMPLE =================

  if (petsLoading || isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('planner.title') }} />
        <StateView loading />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('planner.title') }} />
        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing.lg }}>
          <StateView emoji="⚠️" title={t('planner.errorGeneric')} description={String(error)} />
          <Button title={t('common.retry')} onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('planner.title') }} />
        <StateView emoji="🐾" title={t('planner.noPets')} description={t('planner.noPetsHint')} />
      </SafeAreaView>
    );
  }

  // ================= UI PRINCIPAL =================

  const petName = (id: string | null) => pets.find((p) => p.id === id)?.name ?? t('planner.allPets');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('planner.title') }} />

      {/* Selector animal: Toate + fiecare animal */}
      <View style={[styles.petRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {t('planner.pickPet')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable
            onPress={() => setSelectedPetId(null)}
            style={[
              styles.petChip,
              {
                backgroundColor: selectedPetId === null ? theme.colors.primary : theme.colors.surface,
                borderColor: selectedPetId === null ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text style={{ color: selectedPetId === null ? '#fff' : theme.colors.text, fontSize: 13, fontWeight: '700' }}>
              {t('planner.allPets')}
            </Text>
          </Pressable>
          {pets.map((p) => {
            const active = p.id === selectedPetId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPetId(p.id)}
                style={[
                  styles.petChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
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
        {/* Sumar + buton activitate nouă */}
        <Card>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>
                {openToday} {openToday === 1 ? t('planner.taskSingular') : t('planner.taskPlural')}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {t('planner.summaryToday')}
                {overdueCount > 0 ? ` · ${t('planner.summaryOverdue', { count: overdueCount })}` : ''}
              </Text>
            </View>
            <Button title={t('planner.newTask')} onPress={openForm} size="sm" leftIcon={<Ionicons name="add" size={18} color="#fff" />} />
          </View>
        </Card>

        {/* Listă pe secțiuni */}
        {sections.length === 0 ? (
          <StateView emoji="🌿" title={t('planner.empty')} description={t('planner.emptyHint')} />
        ) : (
          sections.map((group) => {
            const meta = BUCKET_META[group.bucket];
            const color = theme.colors[meta.colorKey];
            return (
              <View key={group.bucket} style={{ gap: theme.spacing.sm }}>
                <Text style={{ color, fontSize: 14, fontWeight: '800', letterSpacing: 0.3 }}>
                  {meta.emoji} {t(`planner.bucket_${group.bucket}`)} ({group.tasks.length})
                </Text>
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    theme={theme}
                    t={t}
                    language={i18n.language}
                    petName={selectedPetId === null ? petName(task.pet_id) : null}
                    onToggle={() => onToggle(task)}
                    onDelete={() => onDelete(task)}
                    busy={toggleTask.isPending && toggleTask.variables?.task.id === task.id}
                  />
                ))}
              </View>
            );
          })
        )}

        {/* Comută vizibilitatea finalizate */}
        <Pressable onPress={() => setShowDone((v) => !v)} style={styles.showDoneRow}>
          <Ionicons name={showDone ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' }}>
            {showDone ? t('planner.hideDone') : t('planner.showDone')}
          </Text>
        </Pressable>
      </ScrollView>

      {/* ============ MODAL: activitate nouă ============ */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <View style={styles.modalHeader}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>
                  {t('planner.formTitle')}
                </Text>
                <Pressable onPress={() => setShowForm(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                </Pressable>
              </View>

              {/* Animal (dacă e „Toate", cere alegerea) */}
              <View>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('planner.fieldPet')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {pets.map((p) => {
                    const active = p.id === formPetId;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setFormPetId(p.id)}
                        style={[
                          styles.petChip,
                          {
                            backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 13, fontWeight: '700' }}>
                          {p.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <Input
                label={t('planner.fieldTitle')}
                placeholder={t('planner.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
                autoCapitalize="sentences"
              />

              {/* Categorie */}
              <View>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('planner.fieldCategory')}</Text>
                <View style={styles.chipWrap}>
                  {PLANNER_CATEGORIES.map((c) => {
                    const active = c === category;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setCategory(c)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? theme.colors.primaryLight : theme.colors.surfaceAlt,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 14 }}>{PLANNER_CATEGORY_EMOJI[c]}</Text>
                        <Text style={{ color: active ? theme.colors.primaryDark : theme.colors.text, fontSize: 12, fontWeight: '700' }}>
                          {t(`planner.cat_${c}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Scurtături dată/oră */}
              <View>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('planner.quickSlots')}</Text>
                <View style={styles.chipWrap}>
                  {(
                    [
                      ['now', 'planner.quickNow'],
                      ['evening', 'planner.quickEvening'],
                      ['morning', 'planner.quickMorning'],
                      ['eveningTomorrow', 'planner.quickEveningTomorrow'],
                    ] as const
                  ).map(([kind, key]) => (
                    <Pressable key={kind} onPress={() => applyQuickSlot(kind)} style={[styles.chip, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>{t(key)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Dată + oră */}
              <View style={styles.dateTimeRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('planner.fieldDate')}
                    value={dateText}
                    onChangeText={setDateText}
                    placeholder="AAAA-LL-ZZ"
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('planner.fieldTime')}
                    value={timeText}
                    onChangeText={setTimeText}
                    placeholder="HH:MM"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Recurență */}
              <View>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('planner.fieldRecurrence')}</Text>
                <View style={styles.chipWrap}>
                  {PLANNER_RECURRENCES.map((r) => {
                    const active = r === recurrence;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRecurrence(r)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? theme.colors.primaryLight : theme.colors.surfaceAlt,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: active ? theme.colors.primaryDark : theme.colors.text, fontSize: 12, fontWeight: '700' }}>
                          {t(`planner.rec_${r}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {recurrence !== 'none' ? (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6 }}>
                    {recurrence === 'daily' ? t('planner.recDailyHint') : t('planner.recWeeklyHint')}
                  </Text>
                ) : null}
              </View>

              {formError ? (
                <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>{formError}</Text>
              ) : null}

              <Button
                title={t('planner.save')}
                onPress={onSubmit}
                loading={createTask.isPending}
                fullWidth
                size="lg"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// Rând activitate
// ============================================================

interface TaskRowProps {
  task: PlannerTask;
  theme: ReturnType<typeof useAppTheme>;
  t: (k: string, opts?: Record<string, unknown>) => string;
  language: string;
  petName: string | null;
  onToggle: () => void;
  onDelete: () => void;
  busy?: boolean;
}

function TaskRow({ task, theme, t, language, petName, onToggle, onDelete, busy }: TaskRowProps) {
  const dueLabel = formatDueLabel(task.due_at, t, language);
  return (
    <Card style={{ opacity: task.done ? 0.65 : 1 }}>
      <View style={styles.taskRow}>
        {/* checkbox */}
        <Pressable
          onPress={onToggle}
          disabled={busy}
          hitSlop={8}
          style={[
            styles.checkbox,
            {
              borderColor: task.done ? theme.colors.success : theme.colors.border,
              backgroundColor: task.done ? theme.colors.success : 'transparent',
            },
          ]}
        >
          {task.done ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
        </Pressable>

        {/* conținut */}
        <Pressable onPress={onToggle} disabled={busy} style={{ flex: 1 }}>
          <View style={styles.taskTitleRow}>
            <Text style={{ fontSize: 15 }}>{PLANNER_CATEGORY_EMOJI[task.category]}</Text>
            <Text
              numberOfLines={2}
              style={{
                color: theme.colors.text,
                fontSize: 14,
                fontWeight: '700',
                textDecorationLine: task.done ? 'line-through' : 'none',
                flexShrink: 1,
              }}
            >
              {task.title}
            </Text>
          </View>
          <View style={styles.taskMetaRow}>
            <Text
              style={{
                color: task.done ? theme.colors.textMuted : dueLabel.startsWith(t('planner.today')) ? theme.colors.primary : theme.colors.textMuted,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {dueLabel}
            </Text>
            {task.recurrence !== 'none' ? (
              <View style={[styles.recBadge, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                <Ionicons name="repeat" size={10} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                  {t(`planner.rec_${task.recurrence}`)}
                </Text>
              </View>
            ) : null}
            {petName ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                · {petName}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* ștergere */}
        <Pressable onPress={onDelete} hitSlop={10} style={styles.trashBtn}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </Card>
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trashBtn: {
    padding: 6,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
