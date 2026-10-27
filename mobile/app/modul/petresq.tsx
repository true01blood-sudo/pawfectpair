/**
 * Modulul PetResQ — animale pierdute/găsite.
 * Raportări comunitare (lost/found) + sfaturi (tips) de la comunitate,
 * filtrare tip/specie/oraș, telefon direct, marcare rezolvat.
 *
 * Tab-uri: Toate cazurile | Anunțurile mele
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
  Linking,
  Alert as RNAlert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card, StateView } from '../../components/ui';
import {
  RESQ_TYPES,
  RESQ_TYPE_EMOJI,
  type ResqType,
  type ResqStatus,
  type ResqCaseWithReporter,
  type ResqTipWithAuthor,
} from '@pawfectpair/shared';
import { RESQ_SPECIES_OPTIONS } from '@pawfectpair/shared';
import {
  filterResqCases,
  sortResqCases,
  caseAgeDays,
  countResqByType,
  resqTypeKey,
} from '@pawfectpair/shared';
import { ResqCaseSchema, ResqTipSchema } from '@pawfectpair/shared';
import {
  useResqCases,
  useMyResqCases,
  useResqTips,
  useResqRefreshOnFocus,
  useCreateResqCase,
  useUpdateResqCase,
  useSetResqCaseStatus,
  useDeleteResqCase,
  useCreateResqTip,
} from '../../hooks/useResq';
import { pickFromGallery, type PickedImage } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';

type TabId = 'explore' | 'mine';

type TFn = ReturnType<typeof useTranslation>['t'];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

const SPECIES_EMOJI: Record<string, string> = {
  caine: '🐕',
  pisica: '🐈',
  pasare: '🦜',
  iepure: '🐇',
  rozatoare: '🐹',
  reptila: '🦎',
  alta: '🐾',
};

function speciesLabel(species: string, t: TFn): string {
  return t(`resq.species_${species}`);
}

function fmtAge(days: number, t: TFn): string {
  if (days <= 0) return t('resq.today');
  if (days === 1) return t('resq.yesterday');
  return t('resq.days_ago', { n: days });
}

interface CaseFormState {
  type: ResqType;
  name: string;
  species: string;
  city: string;
  last_seen: string;
  description: string;
  phone: string;
  photo_url: string | null;
}

function emptyForm(type: ResqType = 'lost'): CaseFormState {
  return { type, name: '', species: 'caine', city: '', last_seen: '', description: '', phone: '', photo_url: null };
}

export default function PetResqScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  useResqRefreshOnFocus();

  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';

  const [tab, setTab] = useState<TabId>('explore');
  const [typeFilter, setTypeFilter] = useState<ResqType | null>(null);
  const [statusFilter, setStatusFilter] = useState<ResqStatus | null>('active');
  const [search, setSearch] = useState('');

  const casesQ = useResqCases({ type: typeFilter, status: statusFilter });
  const myQ = useMyResqCases();

  const createCase = useCreateResqCase();
  const updateCase = useUpdateResqCase();
  const setStatus = useSetResqCaseStatus();
  const deleteCase = useDeleteResqCase();
  const createTip = useCreateResqTip();

  const errCases = casesQ.error ? (casesQ.error as Error).message : null;
  const errMine = myQ.error ? (myQ.error as Error).message : null;

  const counts = useMemo(
    () => countResqByType(casesQ.data ?? []),
    [casesQ.data]
  );

  const visibleCases = useMemo(() => {
    const base = tab === 'mine' ? (myQ.data ?? []) : (casesQ.data ?? []);
    const filtered =
      tab === 'mine'
        ? base
        : filterResqCases(base as ResqCaseWithReporter[], { type: typeFilter, search });
    return sortResqCases(filtered as ResqCaseWithReporter[]);
  }, [tab, casesQ.data, myQ.data, typeFilter, search]);

  // Modal raportare/editare
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState<ResqCaseWithReporter | null>(null);
  const [form, setForm] = useState<CaseFormState>(emptyForm());
  const [formErr, setFormErr] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  // Modal detaliu + tips
  const [detail, setDetail] = useState<ResqCaseWithReporter | null>(null);
  const tipsQ = useResqTips(detail?.id ?? null);
  const [tipText, setTipText] = useState('');
  const [tipErr, setTipErr] = useState<string | null>(null);

  const openNew = (type: ResqType) => {
    haptic();
    setEditing(null);
    setForm(emptyForm(type));
    setFormErr(null);
    setFormModal(true);
  };

  const openEdit = (c: ResqCaseWithReporter) => {
    haptic();
    setEditing(c);
    setForm({
      type: resqTypeKey(c.type),
      name: c.name,
      species: c.species,
      city: c.city ?? '',
      last_seen: c.last_seen_location ?? '',
      description: c.description ?? '',
      phone: c.contact_phone ?? '',
      photo_url: c.photo_url,
    });
    setFormErr(null);
    setFormModal(true);
  };

  const pickPhoto = async () => {
    if (!user) return;
    const res: PickedImage | null = await pickFromGallery();
    if (!res) return;
    setPicking(true);
    try {
      const url = await uploadPetPhoto(res.uri, user.id, res.ext);
      setForm((f) => ({ ...f, photo_url: url }));
    } catch {
      setFormErr(t('resq.err_photo'));
    } finally {
      setPicking(false);
    }
  };

  const saveForm = () => {
    setFormErr(null);
    const parsed = ResqCaseSchema.safeParse({
      type: form.type,
      name: form.name,
      species: form.species,
      description: form.description,
      city: form.city || undefined,
      last_seen_location: form.last_seen || undefined,
      contact_phone: form.phone || undefined,
      photo_url: form.photo_url,
    });
    if (!parsed.success) {
      setFormErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    const input = {
      type: parsed.data.type as ResqType,
      name: parsed.data.name,
      species: parsed.data.species,
      description: parsed.data.description,
      city: parsed.data.city,
      last_seen_location: parsed.data.last_seen_location,
      contact_phone: parsed.data.contact_phone,
      photo_url: parsed.data.photo_url,
      pet_id: null,
    };
    const op = editing ? updateCase.mutateAsync({ id: editing.id, input }) : createCase.mutateAsync(input);
    op
      .then(() => {
        setFormModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setFormErr(e.message));
  };

  const sendTip = () => {
    if (!detail) return;
    setTipErr(null);
    const parsed = ResqTipSchema.safeParse({ case_id: detail.id, message: tipText });
    if (!parsed.success) {
      setTipErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    createTip
      .mutateAsync(parsed.data)
      .then(() => {
        setTipText('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setTipErr(e.message));
  };

  const callPhone = (phone: string) => {
    haptic();
    RNAlert.alert(t('resq.call_title'), `${t('resq.call_number')}: ${phone}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('resq.call_now'), onPress: () => Linking.openURL(`tel:${phone}`).catch(() => {}) },
    ]);
  };

  const confirmDelete = (c: ResqCaseWithReporter) => {
    RNAlert.alert(t('resq.delete_title'), t('resq.delete_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCase.mutate(c.id) },
    ]);
  };

  const toggleResolve = (c: ResqCaseWithReporter) => {
    haptic();
    setStatus.mutate({ id: c.id, status: c.status === 'active' ? 'resolved' : 'active' });
  };

  const typeBadgeColor = (ty: string): string => (resqTypeKey(ty) === 'lost' ? colors.danger : colors.success);

  const renderCase = (c: ResqCaseWithReporter) => {
    const mine = c.reporter_id === uid;
    return (
      <Card key={c.id} style={{ marginBottom: 12 }}>
        <View style={s.cardHead}>
          {c.photo_url ? (
            <Image source={{ uri: c.photo_url }} style={s.cardPhoto} contentFit="cover" />
          ) : (
            <View style={[s.cardPhotoFallback, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={{ fontSize: 26 }}>{SPECIES_EMOJI[c.species] ?? '🐾'}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={s.cardTitleRow}>
              <View style={[s.typeBadge, { backgroundColor: typeBadgeColor(c.type) + '22' }]}>
                <Text style={[s.typeBadgeText, { color: typeBadgeColor(c.type) }]}>
                  {RESQ_TYPE_EMOJI[resqTypeKey(c.type)]} {t(`resq.type_${resqTypeKey(c.type)}`)}
                </Text>
              </View>
              {c.status === 'resolved' && (
                <View style={[s.typeBadge, { backgroundColor: colors.success + '22', marginLeft: 6 }]}>
                  <Text style={[s.typeBadgeText, { color: colors.success }]}>✓ {t('resq.resolved')}</Text>
                </View>
              )}
            </View>
            <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={[s.cardMeta, { color: colors.textMuted }]}>
              {speciesLabel(c.species, t)}
              {c.city ? ` · 📍 ${c.city}` : ''}
              {' · '}
              {fmtAge(caseAgeDays(c), t)}
              {c.tips_count ? ` · 💬 ${c.tips_count}` : ''}
            </Text>
          </View>
        </View>

        {c.description ? (
          <Text style={[s.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
            {c.description}
          </Text>
        ) : null}

        <View style={s.cardActions}>
          <View style={{ flex: 1 }}>
            <Button title={t('resq.details')} size="sm" variant="outline" onPress={() => { haptic(); setDetail(c); }} />
          </View>
          {c.contact_phone && !mine ? (
            <View style={{ flex: 1 }}>
              <Button title={t('resq.call')} size="sm" onPress={() => callPhone(c.contact_phone as string)} />
            </View>
          ) : null}
          {tab === 'mine' ? (
            <>
              <View style={{ flex: 1 }}>
                <Button
                  title={c.status === 'active' ? t('resq.mark_resolved') : t('resq.mark_active')}
                  size="sm"
                  variant="outline"
                  onPress={() => toggleResolve(c)}
                />
              </View>
              <TouchableOpacity onPress={() => openEdit(c)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: colors.primary, fontSize: 13 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(c)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: colors.danger, fontSize: 13 }}>🗑️</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Antet + sumar */}
      <View style={[s.header, { paddingHorizontal: 16, paddingTop: 12 }]}>
        <Text style={[s.title, { color: colors.text }]}>🔍 {t('resq.title')}</Text>
        <Text style={[s.subtitle, { color: colors.textMuted }]}>{t('resq.subtitle')}</Text>
      </View>
      <View style={[s.summaryRow, { paddingHorizontal: 16 }]}>
        <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.summaryValue, { color: colors.danger }]}>{counts.lost}</Text>
          <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('resq.active_lost')}</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.summaryValue, { color: colors.success }]}>{counts.found}</Text>
          <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('resq.active_found')}</Text>
        </View>
      </View>

      {/* Tab-uri */}
      <View style={[s.tabs, { paddingHorizontal: 16 }]}>
        <TouchableOpacity style={[s.tabBtn, { backgroundColor: tab === 'explore' ? colors.primary : colors.surface }]} onPress={() => { haptic(); setTab('explore'); }}>
          <Text style={{ color: tab === 'explore' ? '#FFFFFF' : colors.text, fontSize: 13, fontWeight: '700' }}>
            {t('resq.tab_explore')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, { backgroundColor: tab === 'mine' ? colors.primary : colors.surface }]} onPress={() => { haptic(); setTab('mine'); }}>
          <Text style={{ color: tab === 'mine' ? '#FFFFFF' : colors.text, fontSize: 13, fontWeight: '700' }}>
            {t('resq.tab_mine')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtre (doar pe explore) */}
      {tab === 'explore' ? (
        <View style={s.filtersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            <TouchableOpacity
              onPress={() => { haptic(); setTypeFilter(null); }}
              style={[s.chip, { borderColor: colors.border, backgroundColor: !typeFilter ? colors.primary : colors.surface }]}
            >
              <Text style={{ color: !typeFilter ? '#FFFFFF' : colors.text, fontSize: 13 }}>{t('resq.type_all')}</Text>
            </TouchableOpacity>
            {RESQ_TYPES.map((ty) => (
              <TouchableOpacity
                key={ty}
                onPress={() => { haptic(); setTypeFilter(ty); }}
                style={[s.chip, { borderColor: colors.border, backgroundColor: typeFilter === ty ? colors.primary : colors.surface }]}
              >
                <Text style={{ color: typeFilter === ty ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                  {RESQ_TYPE_EMOJI[ty]} {t(`resq.type_${ty}`)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => { haptic(); setStatusFilter(statusFilter === 'active' ? null : 'active'); }}
              style={[s.chip, { borderColor: colors.border, backgroundColor: statusFilter === 'active' ? colors.primaryDark : colors.surface }]}
            >
              <Text style={{ color: statusFilter === 'active' ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                {t('resq.only_active')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
            <Input
              placeholder={t('resq.search_ph')}
              value={search}
              onChangeText={setSearch}
              maxLength={60}
            />
          </View>
        </View>
      ) : null}

      {/* Listă */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'explore' ? (
          <StateView
            loading={casesQ.isLoading}
            error={errCases}
            empty={!errCases && visibleCases.length === 0}
            emoji="🔍"
            title={t('resq.none_title')}
            description={t('resq.none_desc')}
          >
            {visibleCases.map(renderCase)}
          </StateView>
        ) : (
          <StateView
            loading={myQ.isLoading}
            error={errMine}
            empty={!errMine && (myQ.data ?? []).length === 0}
            emoji="📣"
            title={t('resq.mine_none_title')}
            description={t('resq.mine_none_desc')}
          >
            {(myQ.data ?? []).map(renderCase)}
          </StateView>
        )}
        {errCases || errMine ? (
          <Button title={t('common.retry')} variant="outline" onPress={() => { casesQ.refetch(); myQ.refetch(); }} />
        ) : null}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Butoane raportare */}
      <View style={[s.reportRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Button title={t('resq.report_lost')} size="sm" onPress={() => openNew('lost')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title={t('resq.report_found')} size="sm" variant="outline" onPress={() => openNew('found')} />
        </View>
      </View>

      {/* Modal detaliu + tips */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDetail(null)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {detail ? `${RESQ_TYPE_EMOJI[resqTypeKey(detail.type)]} ${detail.name}` : ''}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {detail ? (
                <>
                  <Text style={[s.detailMeta, { color: colors.textMuted }]}>
                    {speciesLabel(detail.species, t)}
                    {detail.city ? ` · 📍 ${detail.city}` : ''}
                    {detail.last_seen_location ? `\n📌 ${detail.last_seen_location}` : ''}
                  </Text>
                  {detail.description ? (
                    <Text style={[s.detailDesc, { color: colors.text }]}>{detail.description}</Text>
                  ) : null}
                  {detail.contact_phone ? (
                    <Button title={`${t('resq.call')}: ${detail.contact_phone}`} onPress={() => callPhone(detail.contact_phone as string)} />
                  ) : null}

                  <Text style={[s.tipsTitle, { color: colors.text }]}>{t('resq.tips_title')}</Text>
                  {tipsQ.isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (tipsQ.data ?? []).length === 0 ? (
                    <Text style={[s.tipsEmpty, { color: colors.textMuted }]}>{t('resq.tips_none')}</Text>
                  ) : (
                    (tipsQ.data ?? []).map((tip: ResqTipWithAuthor) => (
                      <View key={tip.id} style={[s.tipRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                            {tip.author?.full_name ?? t('resq.anonymous')}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{tip.message}</Text>
                        </View>
                      </View>
                    ))
                  )}

                  <View style={{ marginTop: 10 }}>
                    <Input
                      label={t('resq.tip_label')}
                      placeholder={t('resq.tip_ph')}
                      value={tipText}
                      onChangeText={setTipText}
                      maxLength={500}
                      multiline
                    />
                    {tipErr ? <Text style={[s.formError, { color: colors.danger }]}>{tipErr}</Text> : null}
                    <Button
                      title={t('resq.tip_send')}
                      onPress={sendTip}
                      loading={createTip.isPending}
                      disabled={!uid}
                    />
                  </View>
                  <View style={{ height: 20 }} />
                </>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal raportare */}
      <Modal visible={formModal} transparent animationType="slide" onRequestClose={() => setFormModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setFormModal(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editing ? t('resq.edit_title') : t('resq.new_title')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('resq.f_type')}</Text>
              <View style={s.wrapRow}>
                {RESQ_TYPES.map((ty) => (
                  <TouchableOpacity
                    key={ty}
                    onPress={() => { haptic(); setForm((f) => ({ ...f, type: ty })); }}
                    style={[s.chip, { borderColor: colors.border, backgroundColor: form.type === ty ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: form.type === ty ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                      {RESQ_TYPE_EMOJI[ty]} {t(`resq.type_${ty}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('resq.f_name')}
                placeholder={t('resq.f_name_ph')}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                maxLength={60}
              />
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('resq.f_species')}</Text>
              <View style={s.wrapRow}>
                {RESQ_SPECIES_OPTIONS.map((sp) => (
                  <TouchableOpacity
                    key={sp}
                    onPress={() => { haptic(); setForm((f) => ({ ...f, species: sp })); }}
                    style={[s.chip, { borderColor: colors.border, backgroundColor: form.species === sp ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: form.species === sp ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                      {SPECIES_EMOJI[sp] ?? '🐾'} {speciesLabel(sp, t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('resq.f_city')}
                placeholder={t('resq.f_city_ph')}
                value={form.city}
                onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                maxLength={60}
              />
              <Input
                label={t('resq.f_last_seen')}
                placeholder={t('resq.f_last_seen_ph')}
                value={form.last_seen}
                onChangeText={(v) => setForm((f) => ({ ...f, last_seen: v }))}
                maxLength={120}
              />
              <Input
                label={t('resq.f_description')}
                placeholder={t('resq.f_desc_ph')}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                maxLength={1000}
                multiline
              />
              <Input
                label={t('resq.f_phone')}
                placeholder="07xx xxx xxx"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                maxLength={20}
                keyboardType="phone-pad"
              />
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('resq.f_photo')}</Text>
              <TouchableOpacity onPress={pickPhoto} style={[s.photoPick, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                {picking ? (
                  <ActivityIndicator color={colors.primary} />
                ) : form.photo_url ? (
                  <Image source={{ uri: form.photo_url }} style={s.photoPreview} contentFit="cover" />
                ) : (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>📷 {t('resq.f_photo_cta')}</Text>
                )}
              </TouchableOpacity>
              {formErr ? <Text style={[s.formError, { color: colors.danger }]}>{formErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setFormModal(false)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={editing ? t('common.save') : t('resq.publish')}
                    size="sm"
                    onPress={saveForm}
                    loading={createCase.isPending || updateCase.isPending}
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
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
  filtersWrap: { marginBottom: 6 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  container: { maxWidth: 720, width: '100%', alignSelf: 'center', padding: 16, paddingTop: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  cardPhoto: { width: 56, height: 56, borderRadius: 12 },
  cardPhotoFallback: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardMeta: { fontSize: 12 },
  cardDesc: { fontSize: 13, marginTop: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  reportRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  detailMeta: { fontSize: 13, marginBottom: 8 },
  detailDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  tipsTitle: { fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  tipsEmpty: { fontSize: 13, marginBottom: 8 },
  tipRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8 },
  photoPick: { height: 90, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  formError: { fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
});
