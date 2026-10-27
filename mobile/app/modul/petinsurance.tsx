/**
 * Modulul PetInsurance — asigurări veterinare.
 * Polițe per animal (tip, primă, plafon, franhiză, perioadă) cu avertizare
 * la expirare + dosar despăgubiri cu tranziții (trimisă → aprobată → plătită).
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
  POLICY_TYPES,
  POLICY_TYPE_EMOJI,
  type PolicyType,
  type ClaimStatus,
  type InsurancePolicyWithPet,
  type InsuranceClaimWithPolicy,
} from '@pawfectpair/shared';
import {
  policyDaysLeft,
  isExpiringSoon,
  effectivePolicyStatus,
  formatMoneyCents,
  coverageUsedPercent,
  availableClaimTransitions,
  claimsTotalByStatus,
  sortPolicies,
  sortClaims,
} from '@pawfectpair/shared';
import { InsurancePolicySchema, InsuranceClaimSchema } from '@pawfectpair/shared';
import { toDateInput } from '@pawfectpair/shared';
import {
  useInsurancePolicies,
  useInsuranceClaims,
  useInsuranceRefreshOnFocus,
  useCreateInsurancePolicy,
  useUpdateInsurancePolicy,
  useSetInsurancePolicyStatus,
  useDeleteInsurancePolicy,
  useCreateInsuranceClaim,
  useSetInsuranceClaimStatus,
} from '../../hooks/useInsurance';
import { useMyPets } from '../../hooks/usePets';

type TFn = ReturnType<typeof useTranslation>['t'];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function fmtDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
  } catch {
    return iso;
  }
}

interface PolicyFormState {
  pet_id: string | null;
  provider: string;
  policy_number: string;
  policy_type: PolicyType;
  premium: string;       // RON
  coverage: string;      // RON
  deductible: string;    // RON
  start_date: string;
  end_date: string;
  notes: string;
}

function emptyPolicyForm(): PolicyFormState {
  const today = toDateInput();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  return {
    pet_id: null,
    provider: '',
    policy_number: '',
    policy_type: 'comprehensive',
    premium: '',
    coverage: '',
    deductible: '',
    start_date: today,
    end_date: end.toISOString().slice(0, 10),
    notes: '',
  };
}

function ronToCents(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

interface ClaimFormState {
  claim_date: string;
  description: string;
  amount: string; // RON
}

function emptyClaimForm(): ClaimFormState {
  return { claim_date: toDateInput(), description: '', amount: '' };
}

export default function PetInsuranceScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const locale = i18n.language?.slice(0, 2) ?? 'ro';

  useInsuranceRefreshOnFocus();

  const { data: pets = [] } = useMyPets();
  const policiesQ = useInsurancePolicies();
  const claimsQ = useInsuranceClaims();

  const createPolicy = useCreateInsurancePolicy();
  const updatePolicy = useUpdateInsurancePolicy();
  const setPolicyStatus = useSetInsurancePolicyStatus();
  const deletePolicy = useDeleteInsurancePolicy();
  const createClaim = useCreateInsuranceClaim();
  const setClaimStatus = useSetInsuranceClaimStatus();

  const policies = useMemo(
    () => sortPolicies(policiesQ.data ?? []),
    [policiesQ.data]
  );
  const claims = useMemo(
    () => sortClaims(claimsQ.data ?? []),
    [claimsQ.data]
  );
  const totals = useMemo(() => claimsTotalByStatus(claims), [claims]);
  const activeCount = useMemo(
    () => policies.filter((p) => effectivePolicyStatus(p) === 'active').length,
    [policies]
  );

  const [policyModal, setPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicyWithPet | null>(null);
  const [pForm, setPForm] = useState<PolicyFormState>(emptyPolicyForm());
  const [pErr, setPErr] = useState<string | null>(null);

  const [claimPolicy, setClaimPolicy] = useState<InsurancePolicyWithPet | null>(null);
  const [claimForm, setClaimForm] = useState<ClaimFormState>(emptyClaimForm());
  const [claimErr, setClaimErr] = useState<string | null>(null);

  const petName = (petId: string | null): string =>
    pets.find((p) => p.id === petId)?.name ?? t('insurance.whole_family');

  const openNewPolicy = () => {
    haptic();
    setEditingPolicy(null);
    setPForm({ ...emptyPolicyForm(), pet_id: pets[0]?.id ?? null });
    setPErr(null);
    setPolicyModal(true);
  };

  const openEditPolicy = (p: InsurancePolicyWithPet) => {
    haptic();
    setEditingPolicy(p);
    setPForm({
      pet_id: p.pet_id,
      provider: p.provider,
      policy_number: p.policy_number ?? '',
      policy_type: p.policy_type,
      premium: (p.premium_cents / 100).toString(),
      coverage: p.coverage_limit_cents != null ? (p.coverage_limit_cents / 100).toString() : '',
      deductible: p.deductible_cents != null ? (p.deductible_cents / 100).toString() : '',
      start_date: p.start_date,
      end_date: p.end_date,
      notes: p.notes ?? '',
    });
    setPErr(null);
    setPolicyModal(true);
  };

  const savePolicy = () => {
    setPErr(null);
    const parsed = InsurancePolicySchema.safeParse({
      pet_id: pForm.pet_id,
      provider: pForm.provider,
      policy_number: pForm.policy_number || undefined,
      policy_type: pForm.policy_type,
      premium_cents: ronToCents(pForm.premium),
      coverage_limit_cents: pForm.coverage ? ronToCents(pForm.coverage) : null,
      deductible_cents: pForm.deductible ? ronToCents(pForm.deductible) : null,
      start_date: pForm.start_date,
      end_date: pForm.end_date,
      notes: pForm.notes || undefined,
    });
    if (!parsed.success) {
      setPErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    const op = editingPolicy
      ? updatePolicy.mutateAsync({ id: editingPolicy.id, input: { ...parsed.data, policy_type: parsed.data.policy_type as PolicyType } })
      : createPolicy.mutateAsync({ ...parsed.data, policy_type: parsed.data.policy_type as PolicyType });
    op
      .then(() => {
        setPolicyModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setPErr(e.message));
  };

  const confirmDeletePolicy = (p: InsurancePolicyWithPet) => {
    RNAlert.alert(t('insurance.delete_title'), t('insurance.delete_msg', { provider: p.provider }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deletePolicy.mutate(p.id) },
    ]);
  };

  const openClaim = (p: InsurancePolicyWithPet) => {
    haptic();
    setClaimPolicy(p);
    setClaimForm(emptyClaimForm());
    setClaimErr(null);
  };

  const saveClaim = () => {
    if (!claimPolicy) return;
    setClaimErr(null);
    const parsed = InsuranceClaimSchema.safeParse({
      policy_id: claimPolicy.id,
      claim_date: claimForm.claim_date,
      description: claimForm.description,
      amount_cents: ronToCents(claimForm.amount),
    });
    if (!parsed.success) {
      setClaimErr(parsed.error.issues[0]?.message ?? t('common.error'));
      return;
    }
    createClaim
      .mutateAsync(parsed.data)
      .then(() => {
        setClaimPolicy(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((e: Error) => setClaimErr(e.message));
  };

  const advanceClaim = (c: InsuranceClaimWithPolicy) => {
    const options = availableClaimTransitions(c.status);
    if (options.length === 0) return;
    haptic();
    RNAlert.alert(
      t('insurance.claim_status_title'),
      t('insurance.claim_status_msg', { amount: formatMoneyCents(c.amount_cents) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        ...options.map((to) => ({
          text: t(`insurance.claim_${to}`),
          onPress: () => setClaimStatus.mutate({ id: c.id, status: to }),
        })),
      ]
    );
  };

  const statusColor = (p: InsurancePolicyWithPet): string => {
    const st = effectivePolicyStatus(p);
    if (st === 'active') return isExpiringSoon(p) ? colors.danger : colors.success;
    return colors.textMuted;
  };

  const claimStatusColor = (st: ClaimStatus): string =>
    st === 'paid' ? colors.success : st === 'approved' ? colors.primary : st === 'rejected' ? colors.danger : colors.textMuted;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>🛡️ {t('insurance.title')}</Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>{t('insurance.subtitle')}</Text>
        </View>

        {/* Sumar */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryValue, { color: colors.text }]}>{activeCount}</Text>
            <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('insurance.stat_active')}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryValue, { color: colors.primary }]}>{formatMoneyCents(totals.approved + totals.paid)}</Text>
            <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('insurance.stat_claimed')}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryValue, { color: colors.textMuted }]}>{formatMoneyCents(totals.submitted)}</Text>
            <Text style={[s.summaryLabel, { color: colors.textMuted }]}>{t('insurance.stat_pending')}</Text>
          </View>
        </View>

        {/* Polițe */}
        <View style={s.sectionHead}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>{t('insurance.policies_title')}</Text>
          <TouchableOpacity onPress={openNewPolicy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>＋ {t('insurance.add_policy')}</Text>
          </TouchableOpacity>
        </View>

        <StateView
          loading={policiesQ.isLoading}
          error={policiesQ.error ? (policiesQ.error as Error).message : null}
          empty={!policiesQ.isError && policies.length === 0}
          emoji="🛡️"
          title={t('insurance.none_title')}
          description={t('insurance.none_desc')}
        >
          {policies.map((p) => {
            const days = policyDaysLeft(p);
            const eff = effectivePolicyStatus(p);
            const used = coverageUsedPercent(p, claims.filter((c) => c.policy_id === p.id));
            const pClaims = claims.filter((c) => c.policy_id === p.id);
            return (
              <Card key={p.id} style={{ marginBottom: 12 }}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => openEditPolicy(p)}>
                  <View style={s.policyHead}>
                    <Text style={{ fontSize: 24 }}>{POLICY_TYPE_EMOJI[p.policy_type]}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[s.policyProvider, { color: colors.text }]} numberOfLines={1}>
                        {p.provider}
                      </Text>
                      <Text style={[s.policyMeta, { color: colors.textMuted }]}>
                        {t(`insurance.type_${p.policy_type}`)} · {petName(p.pet_id)}
                        {p.policy_number ? ` · #${p.policy_number}` : ''}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusColor(p) + '22', borderColor: statusColor(p) }]}>
                      <Text style={[s.statusText, { color: statusColor(p) }]}>{t(`insurance.status_${eff}`)}</Text>
                    </View>
                  </View>

                  <View style={s.policyMetaRow}>
                    <Text style={[s.metaChip, { color: colors.textMuted }]}>
                      💰 {t('insurance.premium')}: {formatMoneyCents(p.premium_cents)}
                    </Text>
                    {p.coverage_limit_cents != null ? (
                      <Text style={[s.metaChip, { color: colors.textMuted }]}>
                        🏦 {t('insurance.limit')}: {formatMoneyCents(p.coverage_limit_cents)}
                      </Text>
                    ) : null}
                    {p.deductible_cents != null ? (
                      <Text style={[s.metaChip, { color: colors.textMuted }]}>
                        ➖ {t('insurance.deductible')}: {formatMoneyCents(p.deductible_cents)}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={[s.dates, { color: colors.textMuted }]}>
                    {fmtDate(p.start_date, locale)} → {fmtDate(p.end_date, locale)}
                    {eff === 'active'
                      ? days <= 0
                        ? ''
                        : ` · ${t('insurance.days_left', { n: days })}`
                      : ''}
                  </Text>

                  {eff === 'active' && isExpiringSoon(p) && (
                    <Text style={[s.expWarn, { color: colors.danger }]}>⚠️ {t('insurance.expiring_soon')}</Text>
                  )}

                  {used != null && (
                    <View style={{ marginTop: 8 }}>
                      <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={[s.progressFill, { width: `${used}%`, backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={[s.metaChip, { color: colors.textMuted, marginTop: 4 }]}>
                        {t('insurance.coverage_used', { n: used })}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={s.cardActions}>
                  <View style={{ flex: 1 }}>
                    <Button title={t('insurance.new_claim')} size="sm" variant="outline" onPress={() => openClaim(p)} />
                  </View>
                  {pClaims.length > 0 ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {t('insurance.claims_count', { n: pClaims.length })}
                    </Text>
                  ) : null}
                  <TouchableOpacity onPress={() => confirmDeletePolicy(p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ color: colors.danger, fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </StateView>

        {/* Dosar despăgubiri */}
        {claims.length > 0 ? (
          <>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{t('insurance.claims_title')}</Text>
            {claims.map((c) => (
              <View key={c.id} style={[s.claimRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => advanceClaim(c)} disabled={availableClaimTransitions(c.status).length === 0}>
                  <View style={s.claimHead}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                      {c.description}
                    </Text>
                    <View style={[s.claimBadge, { backgroundColor: claimStatusColor(c.status) + '22' }]}>
                      <Text style={[s.claimBadgeText, { color: claimStatusColor(c.status) }]}>
                        {t(`insurance.claim_${c.status}`)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {c.policy?.provider ?? ''} · {fmtDate(c.claim_date, locale)} · {formatMoneyCents(c.amount_cents)}
                  </Text>
                  {availableClaimTransitions(c.status).length > 0 ? (
                    <Text style={{ color: colors.primary, fontSize: 11, marginTop: 4 }}>
                      {t('insurance.tap_advance')} → {availableClaimTransitions(c.status).map((x) => t(`insurance.claim_${x}`)).join(' / ')}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal poliță */}
      <Modal visible={policyModal} transparent animationType="slide" onRequestClose={() => setPolicyModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPolicyModal(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editingPolicy ? t('insurance.edit_policy') : t('insurance.new_policy')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('insurance.f_pet')}</Text>
              <View style={s.wrapRow}>
                <TouchableOpacity
                  onPress={() => { haptic(); setPForm((f) => ({ ...f, pet_id: null })); }}
                  style={[s.chip, { borderColor: colors.border, backgroundColor: !pForm.pet_id ? colors.primary : colors.surface }]}
                >
                  <Text style={{ color: !pForm.pet_id ? '#FFFFFF' : colors.text, fontSize: 13 }}>👨‍👩‍👧 {t('insurance.whole_family')}</Text>
                </TouchableOpacity>
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
                label={t('insurance.f_provider')}
                placeholder={t('insurance.f_provider_ph')}
                value={pForm.provider}
                onChangeText={(v) => setPForm((f) => ({ ...f, provider: v }))}
                maxLength={60}
              />
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{t('insurance.f_type')}</Text>
              <View style={s.wrapRow}>
                {POLICY_TYPES.map((ty) => (
                  <TouchableOpacity
                    key={ty}
                    onPress={() => { haptic(); setPForm((f) => ({ ...f, policy_type: ty })); }}
                    style={[s.chip, { borderColor: colors.border, backgroundColor: pForm.policy_type === ty ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: pForm.policy_type === ty ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                      {POLICY_TYPE_EMOJI[ty]} {t(`insurance.type_${ty}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('insurance.f_number')}
                placeholder="PA-2026-001"
                value={pForm.policy_number}
                onChangeText={(v) => setPForm((f) => ({ ...f, policy_number: v }))}
                maxLength={60}
              />
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('insurance.f_premium')}
                    placeholder="149"
                    value={pForm.premium}
                    onChangeText={(v) => setPForm((f) => ({ ...f, premium: v.replace(/[^0-9.,]/g, '') }))}
                    keyboardType="decimal-pad"
                    maxLength={9}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('insurance.f_limit')}
                    placeholder="5000"
                    value={pForm.coverage}
                    onChangeText={(v) => setPForm((f) => ({ ...f, coverage: v.replace(/[^0-9.,]/g, '') }))}
                    keyboardType="decimal-pad"
                    maxLength={9}
                  />
                </View>
              </View>
              <Input
                label={t('insurance.f_deductible')}
                placeholder="150"
                value={pForm.deductible}
                onChangeText={(v) => setPForm((f) => ({ ...f, deductible: v.replace(/[^0-9.,]/g, '') }))}
                keyboardType="decimal-pad"
                maxLength={9}
              />
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('insurance.f_start')}
                    placeholder="AAAA-LL-ZZ"
                    value={pForm.start_date}
                    onChangeText={(v) => setPForm((f) => ({ ...f, start_date: v }))}
                    maxLength={10}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('insurance.f_end')}
                    placeholder="AAAA-LL-ZZ"
                    value={pForm.end_date}
                    onChangeText={(v) => setPForm((f) => ({ ...f, end_date: v }))}
                    maxLength={10}
                  />
                </View>
              </View>
              <Input
                label={t('insurance.f_notes')}
                placeholder={t('insurance.f_notes_ph')}
                value={pForm.notes}
                onChangeText={(v) => setPForm((f) => ({ ...f, notes: v }))}
                maxLength={500}
                multiline
              />
              {pErr ? <Text style={[s.formError, { color: colors.danger }]}>{pErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setPolicyModal(false)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    title={editingPolicy ? t('common.save') : t('insurance.add_policy')}
                    size="sm"
                    onPress={savePolicy}
                    loading={createPolicy.isPending || updatePolicy.isPending}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal despăgubire */}
      <Modal visible={!!claimPolicy} transparent animationType="slide" onRequestClose={() => setClaimPolicy(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setClaimPolicy(null)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              🧾 {t('insurance.new_claim_for', { provider: claimPolicy?.provider ?? '' })}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label={t('insurance.f_claim_date')}
                placeholder="AAAA-LL-ZZ"
                value={claimForm.claim_date}
                onChangeText={(v) => setClaimForm((f) => ({ ...f, claim_date: v }))}
                maxLength={10}
              />
              <Input
                label={t('insurance.f_claim_desc')}
                placeholder={t('insurance.f_claim_desc_ph')}
                value={claimForm.description}
                onChangeText={(v) => setClaimForm((f) => ({ ...f, description: v }))}
                maxLength={1000}
                multiline
              />
              <Input
                label={t('insurance.f_claim_amount')}
                placeholder="450"
                value={claimForm.amount}
                onChangeText={(v) => setClaimForm((f) => ({ ...f, amount: v.replace(/[^0-9.,]/g, '') }))}
                keyboardType="decimal-pad"
                maxLength={9}
              />
              {claimErr ? <Text style={[s.formError, { color: colors.danger }]}>{claimErr}</Text> : null}
              <View style={s.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title={t('common.cancel')} size="sm" onPress={() => setClaimPolicy(null)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button title={t('insurance.submit_claim')} size="sm" onPress={saveClaim} loading={createClaim.isPending} />
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
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 17, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  policyHead: { flexDirection: 'row', alignItems: 'center' },
  policyProvider: { fontSize: 16, fontWeight: '700' },
  policyMeta: { fontSize: 12, marginTop: 1 },
  statusBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  policyMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  metaChip: { fontSize: 12 },
  dates: { fontSize: 12, marginTop: 6 },
  expWarn: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  claimRow: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  claimHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  claimBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  claimBadgeText: { fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, marginRight: 6, marginBottom: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  formError: { fontSize: 13, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
});
