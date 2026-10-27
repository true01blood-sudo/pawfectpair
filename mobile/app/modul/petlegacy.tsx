/**
 * Modulul PetLegacy — plan de îngrijire pentru Situații de Urgență +
 * memorial digital. Planurile au progres de completitudine cu checklist;
 * memorialele pot fi private sau publice (pagină de omagiu).
 *
 * Tab-uri: Planuri | Memoriale
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
  Switch,
  Alert as RNAlert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card, StateView } from '../../components/ui';
import type {
  LegacyPlanWithPet,
  PetMemorial,
} from '@pawfectpair/shared';
import {
  planCompleteness,
  planChecklist,
  isPlanReady,
  daysSincePassed,
  daysToAnniversary,
  sortMemorials,
  sortPlansByCompleteness,
} from '@pawfectpair/shared';
import { LegacyPlanSchema, PetMemorialSchema } from '@pawfectpair/shared';
import {
  useLegacyPlans,
  useMyMemorials,
  useLegacyRefreshOnFocus,
  useSaveLegacyPlan,
  useDeleteLegacyPlan,
  useCreateMemorial,
  useUpdateMemorial,
  useDeleteMemorial,
} from '../../hooks/useLegacy';
import { useMyPets } from '../../hooks/usePets';
import { pickFromGallery, type PickedImage } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';

type TabId = 'plans' | 'memorials';

type TFn = ReturnType<typeof useTranslation>['t'];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function fmtDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(`${iso}T00:00:00`)
    );
  } catch {
    return iso;
  }
}

function ronToCents(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

interface PlanFormState {
  pet_id: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  budget: string;
  instructions: string;
  wishes: string;
}

function emptyPlanForm(petId: string | null): PlanFormState {
  return {
    pet_id: petId,
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    budget: '',
    instructions: '',
    wishes: '',
  };
}

interface MemorialFormState {
  pet_id: string | null;
  pet_name: string;
  species: string;
  passed_at: string;
  resting_place: string;
  tribute: string;
  favorite_memory: string;
  photo_url: string | null;
  is_public: boolean;
}

function emptyMemorialForm(): MemorialFormState {
  return {
    pet_id: null,
    pet_name: '',
    species: '',
    passed_at: new Date().toISOString().slice(0, 10),
    resting_place: '',
    tribute: '',
    favorite_memory: '',
    photo_url: null,
    is_public: false,
  };
}

export default function PetLegacyScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const locale = i18n.language?.slice(0, 2) ?? 'ro';

  useLegacyRefreshOnFocus();

  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';

  const { data: pets = [] } = useMyPets();
  const plansQ = useLegacyPlans();
  const memorialsQ = useMyMemorials();

  const savePlan = useSaveLegacyPlan();
  const deletePlan = useDeleteLegacyPlan();
  const createMem = useCreateMemorial();
  const updateMem = useUpdateMemorial();
  const deleteMem = useDeleteMemorial();

  const [tab, setTab] = useState<TabId>('plans');

  const plans = useMemo(
    () => sortPlansByCompleteness(plansQ.data ?? []),
    [plansQ.data]
  );
  const memorials = useMemo(
    () => sortMemorials(memorialsQ.data ?? []),
    [memorialsQ.data]
  );

  // Modal plan
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LegacyPlanWithPet | null>(null);
  const [pForm, setPForm] = useState<PlanFormState>(emptyPlanForm(null));
  const [pErr, setPErr] = useState<string | null>(null);

  // Modal memorial
  const [memModal, setMemModal] = useState(false);
  const [editingMem, setEditingMem] = useState<PetMemorial | null>(null);
  const [mForm, setMForm] = useState<MemorialFormState>(emptyMemorialForm());
  const [mErr, setMErr] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const petName = (petId: string | null): string =>
    pets.find((p) => p.id === petId)?.name ?? t('legacy.no_pet_linked');

  const openNewPlan = () => {
    haptic();
    setEditingPlan(null);
    setPForm(emptyPlanForm(pets[0]?.id ?? null));
    setPErr(null);
    setPlanModal(true);
  };

  const openEditPlan = (p: LegacyPlanWithPet) => {
    haptic();
    setEditingPlan(p);
    setPForm({
      pet_id: p.pet_id,
      guardian_name: p.guardian_name,
      guardian_phone: p.guardian_phone ?? '',
      guardian_email: p.guardian_email ?? '',
      budget: p.care_budget_cents != null ? (p.care_budget_cents / 100).toString() : '',
      instructions: p.instructions ?? '',
      wishes: p.wishes ?? '',
    });
    setPErr(null);
    setPlanModal(true);
  };

  const savePlanForm = () => {
    setPErr(null);
    const parsed = LegacyPlanSchema.safeParse({
      pet_id: pForm.pet_id,
      guardian_name: pForm.guardian_name,
      guardian_phone: pForm.guardian_phone || undefined,
      guardian_email: pForm.guardian_email || undefined,
      care_budget_cents: pForm.budget ? ronToCents(pForm.budget) : undefined,
      instructions: pForm.instructions || undefined,
      wishes: pForm.wishes || undefined,
    });
    if (!parsed.success) {
      setPErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    savePlan
      .mutateAsync({
        input: {
          pet_id: parsed.data.pet_id,
          guardian_name: parsed.data.guardian_name,
          guardian_phone: parsed.data.guardian_phone,
          guardian_email: parsed.data.guardian_email,
          instructions: parsed.data.instructions,
          care_budget_cents: parsed.data.care_budget_cents,
          wishes: parsed.data.wishes,
        },
        existingId: editingPlan?.id ?? null,
      })
      .then(() => {
        setPlanModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setPErr(e.message));
  };

  const confirmDeletePlan = (p: LegacyPlanWithPet) => {
    RNAlert.alert(
      t('legacy.plan_delete_title'),
      t('legacy.plan_delete_msg', { pet: petName(p.pet_id) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deletePlan.mutate(p.id) },
      ]
    );
  };

  const openNewMemorial = () => {
    haptic();
    setEditingMem(null);
    setMForm(emptyMemorialForm());
    setMErr(null);
    setMemModal(true);
  };

  const openEditMemorial = (m: PetMemorial) => {
    haptic();
    setEditingMem(m);
    setMForm({
      pet_id: m.pet_id,
      pet_name: m.pet_name,
      species: m.species ?? '',
      passed_at: m.passed_at,
      resting_place: m.resting_place ?? '',
      tribute: m.tribute ?? '',
      favorite_memory: m.favorite_memory ?? '',
      photo_url: m.photo_url,
      is_public: m.is_public,
    });
    setMErr(null);
    setMemModal(true);
  };

  const pickPhoto = async () => {
    if (!user) return;
    const res: PickedImage | null = await pickFromGallery();
    if (!res) return;
    setPicking(true);
    try {
      const url = await uploadPetPhoto(res.uri, user.id, res.ext);
      setMForm((f) => ({ ...f, photo_url: url }));
    } catch {
      setMErr(t('legacy.err_photo'));
    } finally {
      setPicking(false);
    }
  };

  const saveMemForm = () => {
    setMErr(null);
    const parsed = PetMemorialSchema.safeParse({
      pet_id: mForm.pet_id,
      pet_name: mForm.pet_name,
      species: mForm.species || undefined,
      photo_url: mForm.photo_url,
      tribute: mForm.tribute || undefined,
      favorite_memory: mForm.favorite_memory || undefined,
      passed_at: mForm.passed_at,
      resting_place: mForm.resting_place || undefined,
      is_public: mForm.is_public,
    });
    if (!parsed.success) {
      setMErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    const op = editingMem
      ? updateMem.mutateAsync({ id: editingMem.id, input: parsed.data })
      : createMem.mutateAsync(parsed.data);
    op
      .then(() => {
        setMemModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setMErr(e.message));
  };

  const confirmDeleteMemorial = (m: PetMemorial) => {
    RNAlert.alert(t('legacy.mem_delete_title'), t('legacy.mem_delete_msg', { name: m.pet_name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMem.mutate(m.id) },
    ]);
  };

  const checklistLabel = (key: string): string => t(`legacy.check_${key}`);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[s.header, { paddingHorizontal: 16, paddingTop: 12 }]}>
        <Text style={[s.title, { color: colors.text }]}>🌷 {t('legacy.title')}</Text>
        <Text style={[s.subtitle, { color: colors.textMuted }]}>{t('legacy.subtitle')}</Text>
      </View>

      {/* Tab-uri */}
      <View style={[s.tabs, { paddingHorizontal: 16 }]}>
        <TouchableOpacity
          style={[s.tabBtn, { backgroundColor: tab === 'plans' ? colors.primary : colors.surface }]}
          onPress={() => { haptic(); setTab('plans'); }}
        >
          <Text style={{ color: tab === 'plans' ? '#FFFFFF' : colors.text, fontSize: 13, fontWeight: '700' }}>
            🛡️ {t('legacy.tab_plans')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, { backgroundColor: tab === 'memorials' ? colors.primary : colors.surface }]}
          onPress={() => { haptic(); setTab('memorials'); }}
        >
          <Text style={{ color: tab === 'memorials' ? '#FFFFFF' : colors.text, fontSize: 13, fontWeight: '700' }}>
            🕊️ {t('legacy.tab_memorials')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {tab === 'plans' ? (
          <>
            {/* Pitch */}
            <View style={[s.pitchCard, { backgroundColor: colors.primaryLight }]}>
              <Text style={[s.pitchText, { color: colors.text }]}>💡 {t('legacy.pitch')}</Text>
            </View>

            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>{t('legacy.plans_title')}</Text>
              <TouchableOpacity onPress={openNewPlan} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>＋ {t('legacy.add_plan')}</Text>
              </TouchableOpacity>
            </View>

            <StateView
              loading={plansQ.isLoading}
              error={plansQ.error ? (plansQ.error as Error).message : null}
              empty={!plansQ.isError && plans.length === 0}
              emoji="🛡️"
              title={t('legacy.plans_none_title')}
              description={t('legacy.plans_none_desc')}
            >
              {plans.map((p) => {
                const pct = planCompleteness(p);
                const checklist = planChecklist(p);
                const ready = isPlanReady(p);
                return (
                  <Card key={p.id} style={{ marginBottom: 12 }}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openEditPlan(p)}>
                      <View style={s.planHead}>
                        <Text style={{ fontSize: 22 }}>🛡️</Text>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[s.planName, { color: colors.text }]} numberOfLines={1}>
                            {petName(p.pet_id)}
                          </Text>
                          <Text style={[s.planMeta, { color: colors.textMuted }]} numberOfLines={1}>
                            👤 {p.guardian_name}
                          </Text>
                        </View>
                        <View style={[s.pctBadge, { backgroundColor: (ready ? colors.success : colors.primary) + '22' }]}>
                          <Text style={[s.pctText, { color: ready ? colors.success : colors.primary }]}>{pct}%</Text>
                        </View>
                      </View>

                      <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View
                          style={[
                            s.progressFill,
                            { width: `${pct}%`, backgroundColor: ready ? colors.success : colors.primary },
                          ]}
                        />
                      </View>

                      <View style={s.checkRow}>
                        {checklist.map((item) => (
                          <View key={item.key} style={[s.checkChip, { backgroundColor: colors.surfaceAlt }]}>
                            <Text style={{ fontSize: 11, color: colors.textMuted }}>
                              {item.done ? '✅' : '⬜'} {checklistLabel(item.key)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {p.instructions ? (
                        <Text style={[s.planNote, { color: colors.textMuted }]} numberOfLines={2}>
                          📋 {p.instructions}
                        </Text>
                      ) : null}
                      {!ready ? (
                        <Text style={[s.planWarn, { color: '#F59E0B' }]}>⚠️ {t('legacy.plan_incomplete')}</Text>
                      ) : null}
                    </TouchableOpacity>
                    <View style={s.cardActions}>
                      <View style={{ flex: 1 }}>
                        <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => openEditPlan(p)} />
                      </View>
                      <TouchableOpacity onPress={() => confirmDeletePlan(p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ color: colors.danger, fontSize: 13 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </StateView>
          </>
        ) : (
          <>
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>{t('legacy.memorials_title')}</Text>
              <TouchableOpacity onPress={openNewMemorial} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>＋ {t('legacy.add_memorial')}</Text>
              </TouchableOpacity>
            </View>

            <StateView
              loading={memorialsQ.isLoading}
              error={memorialsQ.error ? (memorialsQ.error as Error).message : null}
              empty={!memorialsQ.isError && memorials.length === 0}
              emoji="🕊️"
              title={t('legacy.mem_none_title')}
              description={t('legacy.mem_none_desc')}
            >
              {memorials.map((m) => {
                const days = daysSincePassed(m, new Date());
                const anniv = daysToAnniversary(m, new Date());
                return (
                  <Card key={m.id} style={{ marginBottom: 12 }}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openEditMemorial(m)}>
                      <View style={s.memHead}>
                        {m.photo_url ? (
                          <Image source={{ uri: m.photo_url }} style={s.memPhoto} contentFit="cover" />
                        ) : (
                          <View style={[s.memPhotoFallback, { backgroundColor: colors.surfaceAlt }]}>
                            <Text style={{ fontSize: 24 }}>🕊️</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={s.memNameRow}>
                            <Text style={[s.memName, { color: colors.text }]} numberOfLines={1}>
                              {m.pet_name}
                            </Text>
                            {m.is_public ? (
                              <View style={[s.pubBadge, { backgroundColor: colors.primary + '22' }]}>
                                <Text style={[s.pubText, { color: colors.primary }]}>{t('legacy.public')}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[s.memMeta, { color: colors.textMuted }]}>
                            {fmtDate(m.passed_at, locale)} · {t('legacy.days_memory', { n: days })}
                          </Text>
                          {anniv === 0 ? (
                            <Text style={[s.anniv, { color: colors.primary }]}>🕯️ {t('legacy.anniv_today')}</Text>
                          ) : anniv <= 7 ? (
                            <Text style={[s.anniv, { color: colors.textMuted }]}>🕯️ {t('legacy.anniv_soon', { n: anniv })}</Text>
                          ) : null}
                        </View>
                      </View>

                      {m.tribute ? (
                        <Text style={[s.memTribute, { color: colors.text }]} numberOfLines={3}>
                          „{m.tribute}"
                        </Text>
                      ) : null}
                      {m.favorite_memory ? (
                        <Text style={[s.memMemory, { color: colors.textMuted }]} numberOfLines={2}>
                          ⭐ {m.favorite_memory}
                        </Text>
                      ) : null}
                      {m.resting_place ? (
                        <Text style={[s.memRest, { color: colors.textMuted }]}>📍 {m.resting_place}</Text>
                      ) : null}
                    </TouchableOpacity>
                    <View style={s.cardActions}>
                      <View style={{ flex: 1 }}>
                        <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => openEditMemorial(m)} />
                      </View>
                      <TouchableOpacity onPress={() => confirmDeleteMemorial(m)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ color: colors.danger, fontSize: 13 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </StateView>

            <Text style={[s.memoriamNote, { color: colors.textMuted }]}>
              🕊️ {t('legacy.in_memoriam')}
            </Text>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal plan */}
      <Modal visible={planModal} transparent animationType="slide" onRequestClose={() => setPlanModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPlanModal(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editingPlan ? t('legacy.edit_plan') : t('legacy.new_plan')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('legacy.f_pet')}</Text>
              <View style={s.wrapRow}>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    onPress={() => { haptic(); setPForm((f) => ({ ...f, pet_id: pet.id })); }}
                    style={[s.chip, { borderColor: colors.border, backgroundColor: pForm.pet_id === pet.id ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: pForm.pet_id === pet.id ? '#FFFFFF' : colors.text, fontSize: 13 }}>{pet.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('legacy.f_guardian')}
                placeholder={t('legacy.f_guardian_ph')}
                value={pForm.guardian_name}
                onChangeText={(v) => setPForm((f) => ({ ...f, guardian_name: v }))}
                maxLength={80}
              />
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('legacy.f_phone')}
                    placeholder="07xx xxx xxx"
                    value={pForm.guardian_phone}
                    onChangeText={(v) => setPForm((f) => ({ ...f, guardian_phone: v }))}
                    maxLength={20}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('legacy.f_email')}
                    placeholder="nume@email.ro"
                    value={pForm.guardian_email}
                    onChangeText={(v) => setPForm((f) => ({ ...f, guardian_email: v }))}
                    maxLength={80}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <Input
                label={t('legacy.f_budget')}
                placeholder="500"
                value={pForm.budget}
                onChangeText={(v) => setPForm((f) => ({ ...f, budget: v.replace(/[^0-9.,]/g, '') }))}
                keyboardType="decimal-pad"
                maxLength={9}
              />
              <Input
                label={t('legacy.f_instructions')}
                placeholder={t('legacy.f_instructions_ph')}
                value={pForm.instructions}
                onChangeText={(v) => setPForm((f) => ({ ...f, instructions: v }))}
                maxLength={1000}
                multiline
              />
              <Input
                label={t('legacy.f_wishes')}
                placeholder={t('legacy.f_wishes_ph')}
                value={pForm.wishes}
                onChangeText={(v) => setPForm((f) => ({ ...f, wishes: v }))}
                maxLength={1000}
                multiline
              />
              {pErr ? <Text style={[s.formError, { color: colors.danger }]}>{pErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setPlanModal(false)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={editingPlan ? t('common.save') : t('legacy.save_plan')}
                    size="sm"
                    onPress={savePlanForm}
                    loading={savePlan.isPending}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal memorial */}
      <Modal visible={memModal} transparent animationType="slide" onRequestClose={() => setMemModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setMemModal(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editingMem ? t('legacy.edit_memorial') : t('legacy.new_memorial')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label={t('legacy.f_pet_name')}
                placeholder={t('legacy.f_pet_name_ph')}
                value={mForm.pet_name}
                onChangeText={(v) => setMForm((f) => ({ ...f, pet_name: v }))}
                maxLength={60}
              />
              <Input
                label={t('legacy.f_species')}
                placeholder={t('legacy.f_species_ph')}
                value={mForm.species}
                onChangeText={(v) => setMForm((f) => ({ ...f, species: v }))}
                maxLength={30}
              />
              <Input
                label={t('legacy.f_passed')}
                placeholder="AAAA-LL-ZZ"
                value={mForm.passed_at}
                onChangeText={(v) => setMForm((f) => ({ ...f, passed_at: v }))}
                maxLength={10}
              />
              <Input
                label={t('legacy.f_resting')}
                placeholder={t('legacy.f_resting_ph')}
                value={mForm.resting_place}
                onChangeText={(v) => setMForm((f) => ({ ...f, resting_place: v }))}
                maxLength={120}
              />
              <Input
                label={t('legacy.f_tribute')}
                placeholder={t('legacy.f_tribute_ph')}
                value={mForm.tribute}
                onChangeText={(v) => setMForm((f) => ({ ...f, tribute: v }))}
                maxLength={1500}
                multiline
              />
              <Input
                label={t('legacy.f_memory')}
                placeholder={t('legacy.f_memory_ph')}
                value={mForm.favorite_memory}
                onChangeText={(v) => setMForm((f) => ({ ...f, favorite_memory: v }))}
                maxLength={500}
                multiline
              />
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('legacy.f_photo')}</Text>
              <TouchableOpacity onPress={pickPhoto} style={[s.photoPick, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                {picking ? (
                  <ActivityIndicator color={colors.primary} />
                ) : mForm.photo_url ? (
                  <Image source={{ uri: mForm.photo_url }} style={s.photoPreview} contentFit="cover" />
                ) : (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>📷 {t('legacy.f_photo_cta')}</Text>
                )}
              </TouchableOpacity>
              <View style={[s.pubRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{t('legacy.f_public')}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{t('legacy.f_public_hint')}</Text>
                </View>
                <Switch
                  value={mForm.is_public}
                  onValueChange={(v) => { haptic(); setMForm((f) => ({ ...f, is_public: v })); }}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
              {mErr ? <Text style={[s.formError, { color: colors.danger }]}>{mErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setMemModal(false)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={editingMem ? t('common.save') : t('legacy.save_memorial')}
                    size="sm"
                    onPress={saveMemForm}
                    loading={createMem.isPending || updateMem.isPending}
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
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
  container: { maxWidth: 720, width: '100%', alignSelf: 'center', padding: 16, paddingTop: 4 },
  pitchCard: { borderRadius: 14, padding: 12, marginBottom: 16 },
  pitchText: { fontSize: 13, lineHeight: 19 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  planHead: { flexDirection: 'row', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '700' },
  planMeta: { fontSize: 12, marginTop: 2 },
  pctBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pctText: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 999 },
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  checkChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  planNote: { fontSize: 12, marginTop: 8 },
  planWarn: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  memHead: { flexDirection: 'row', alignItems: 'center' },
  memPhoto: { width: 60, height: 60, borderRadius: 14 },
  memPhotoFallback: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  memNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  pubBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pubText: { fontSize: 10, fontWeight: '700' },
  memMeta: { fontSize: 12, marginTop: 2 },
  anniv: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  memTribute: { fontSize: 14, lineHeight: 20, marginTop: 10, fontStyle: 'italic' },
  memMemory: { fontSize: 12, marginTop: 6 },
  memRest: { fontSize: 12, marginTop: 4 },
  memoriamNote: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, marginRight: 6, marginBottom: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  formError: { fontSize: 13, marginBottom: 8 },
  photoPick: { height: 90, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  pubRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
});
