/**
 * Ecran Adopții — anunțuri de adoptare & aplicații.
 *
 * Funcționalități MVP:
 * - Explorează: listă publică (RLS read-all) cu filtre specie + oraș,
 *   carduri cu foto/specie/sex/mărime/vârstă/oraș + autor
 * - Aplică la anunț (mesaj opțional; duplicate blocate în DB prin unique)
 * - Anunțurile mele: creare cu upload foto (5MB, JPEG/PNG/WebP/HEIC),
 *   schimbare status (available/pending/adopted), ștergere
 * - Aplicațiile primite: accept/reject; Aplicațiile mele: retragere
 *
 * Securitate: validare Zod (@pawfectpair/shared), sanitizare în queries,
 * upload foto validat (tip+dimensiune), path storage per utilizator.
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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView, Input, Avatar } from '../../components/ui';
import { useAuthStore } from '../../store/auth.store';
import {
  useAdoptionListings,
  useMyAdoptionListings,
  useCreateAdoptionListing,
  useUpdateAdoptionStatus,
  useDeleteAdoptionListing,
  useApplyToAdoption,
  useListingApplications,
  useMyApplications,
  useSetApplicationStatus,
} from '../../hooks/useAdoptii';
import { pickFromGallery, type PickedImage } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import {
  SPECIES_OPTIONS,
  SPECIES_EMOJI,
  ADOPTION_SIZES,
  ADOPTION_STATUSES,
  ADOPTION_SEX_EMOJI,
  AdoptionListingSchema,
  type AdoptionListing,
  type Species,
  type AdoptionSex,
  type AdoptionSize,
  type AdoptionStatus,
} from '@pawfectpair/shared';

// ============================================================
// Helpers
// ============================================================

const STATUS_COLOR: Record<AdoptionStatus, string> = {
  available: '#16A34A',
  pending: '#F59E0B',
  adopted: '#6B7280',
};

function ageLabel(ageYears: number | null | undefined, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (ageYears == null) return t('adoptii.ageUnknown');
  if (ageYears < 1) return t('adoptii.ageBaby');
  const n = Math.floor(ageYears);
  return t('adoptii.ageYears', { count: n });
}

// ============================================================
// Ecran
// ============================================================

type LocalTab = 'explore' | 'mine';

export default function AdoptiiScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const userId = useAuthStore((s) => s.session?.user?.id);

  // --- tab + filtre ---
  const [tab, setTab] = useState<LocalTab>('explore');
  const [speciesFilter, setSpeciesFilter] = useState<Species | undefined>(undefined);
  const [cityText, setCityText] = useState('');

  // --- date ---
  const { data: listings, isLoading, error, refetch } = useAdoptionListings({
    species: speciesFilter,
    city: cityText.trim() || undefined,
    status: undefined, // arătăm toate statusurile în explore; badge arată starea
  });
  const mine = useMyAdoptionListings();
  const myApps = useMyApplications();

  // --- mutații ---
  const createListing = useCreateAdoptionListing();
  const updateStatus = useUpdateAdoptionStatus();
  const deleteListing = useDeleteAdoptionListing();
  const apply = useApplyToAdoption();
  const setAppStatus = useSetApplicationStatus();

  // --- modale ---
  const [applyFor, setApplyFor] = useState<AdoptionListing | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdoptionListing | null>(null);
  const [appsFor, setAppsFor] = useState<AdoptionListing | null>(null);
  const [showForm, setShowForm] = useState(false);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }),
    [i18n.language]
  );

  const onSubmitApply = async () => {
    if (!applyFor) return;
    setApplyError(null);
    try {
      await apply.mutateAsync({ listingId: applyFor.id, message: applyMessage.trim() || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setApplyFor(null);
      setApplyMessage('');
      RNAlert.alert(t('adoptii.appliedTitle'), t('adoptii.appliedBody', { name: applyFor.name }));
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : t('adoptii.errorGeneric'));
    }
  };

  const onDeleteListing = (listing: AdoptionListing) => {
    RNAlert.alert(t('adoptii.deleteTitle'), t('adoptii.deleteBody', { name: listing.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteListing.mutate(listing.id),
      },
    ]);
  };

  // ================= STĂRI SIMPLE =================

  if (!userId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('adoptii.title') }} />
        <StateView emoji="🔒" title={t('adoptii.needAuth')} description={t('adoptii.needAuthHint')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('adoptii.title') }} />

      {/* Tab-uri locale */}
      <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
        {(
          [
            ['explore', 'adoptii.tabExplore'],
            ['mine', 'adoptii.tabMine'],
          ] as const
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tab, active && { backgroundColor: theme.colors.primaryLight }]}
            >
              <Text style={{ color: active ? theme.colors.primaryDark : theme.colors.textMuted, fontWeight: '800', fontSize: 13 }}>
                {t(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'explore' ? (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          {/* Filtre */}
          <View style={{ gap: theme.spacing.sm }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Pressable
                onPress={() => setSpeciesFilter(undefined)}
                style={[styles.filterChip, { backgroundColor: !speciesFilter ? theme.colors.primary : theme.colors.surface, borderColor: !speciesFilter ? theme.colors.primary : theme.colors.border }]}
              >
                <Text style={{ color: !speciesFilter ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '700' }}>
                  {t('adoptii.allSpecies')}
                </Text>
              </Pressable>
              {SPECIES_OPTIONS.map((sp) => {
                const active = sp === speciesFilter;
                return (
                  <Pressable
                    key={sp}
                    onPress={() => setSpeciesFilter(active ? undefined : sp)}
                    style={[styles.filterChip, { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border }]}
                  >
                    <Text style={{ fontSize: 13 }}>{SPECIES_EMOJI[sp]}</Text>
                    <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '700' }}>{sp}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <TextInput
              value={cityText}
              onChangeText={setCityText}
              placeholder={t('adoptii.cityPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.cityInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              maxLength={60}
            />
          </View>

          {isLoading ? (
            <StateView loading />
          ) : error ? (
            <StateView emoji="⚠️" title={t('adoptii.errorGeneric')} description={String(error)} />
          ) : !listings || listings.length === 0 ? (
            <StateView emoji="🏠" title={t('adoptii.empty')} description={t('adoptii.emptyHint')} />
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                theme={theme}
                t={t}
                mine={listing.posted_by === userId}
                dateLabel={dateFmt.format(new Date(listing.created_at))}
                onDetail={() => setDetail(listing)}
                onApply={() => {
                  setApplyFor(listing);
                  setApplyMessage('');
                  setApplyError(null);
                }}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <Button title={t('adoptii.newListing')} onPress={() => setShowForm(true)} leftIcon={<Ionicons name="add" size={18} color="#fff" />} />

          {/* Anunțurile mele */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
            {t('adoptii.myListingsSection')}
          </Text>
          {mine.isLoading ? (
            <StateView loading />
          ) : !mine.data || mine.data.length === 0 ? (
            <StateView emoji="📭" title={t('adoptii.noListings')} description={t('adoptii.noListingsHint')} />
          ) : (
            mine.data.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                theme={theme}
                t={t}
                mine
                dateLabel={dateFmt.format(new Date(listing.created_at))}
                onDetail={() => setDetail(listing)}
                onApps={() => setAppsFor(listing)}
                onDelete={() => onDeleteListing(listing)}
                onStatus={(s) => updateStatus.mutate({ id: listing.id, status: s })}
              />
            ))
          )}

          {/* Aplicațiile mele (candidat) */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
            {t('adoptii.myAppsSection')}
          </Text>
          {myApps.isLoading ? (
            <StateView loading />
          ) : !myApps.data || myApps.data.length === 0 ? (
            <StateView emoji="🌱" title={t('adoptii.noApps')} description={t('adoptii.noAppsHint')} />
          ) : (
            myApps.data.map((appItem) => (
              <Card key={appItem.id}>
                <View style={styles.appRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                      {appItem.listing_name ?? '—'}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={2}>
                      {appItem.message || t('adoptii.noMessage')}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                      {dateFmt.format(new Date(appItem.created_at))}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: APP_STATUS_BG(appItem.status) }]}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                      {t(`adoptii.appStatus_${appItem.status}`)}
                    </Text>
                  </View>
                  {appItem.status === 'pending' ? (
                    <Pressable onPress={() => setAppStatus.mutate({ id: appItem.id, status: 'withdrawn' })} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={20} color={theme.colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB explore (listă nouă rapid) */}
      {tab === 'explore' ? (
        <Pressable
          onPress={() => setShowForm(true)}
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      ) : null}

      {/* ============ MODAL DETALIU ============ */}
      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
            {detail ? (
              <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
                <View style={styles.sheetHeader}>
                  <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }}>
                    {SPECIES_EMOJI[detail.species]} {detail.name}
                  </Text>
                  <Pressable onPress={() => setDetail(null)} hitSlop={12}>
                    <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                  </Pressable>
                </View>
                {detail.photo_url ? (
                  <Image source={{ uri: detail.photo_url }} style={styles.detailPhoto} contentFit="cover" />
                ) : null}
                <View style={styles.metaWrap}>
                  <MetaChip label={detail.species} />
                  {detail.breed ? <MetaChip label={detail.breed} /> : null}
                  <MetaChip label={ageLabel(detail.age_years, t)} />
                  <MetaChip label={`${ADOPTION_SEX_EMOJI[detail.sex]} ${t(`adoptii.sex_${detail.sex}`)}`} />
                  <MetaChip label={t(`adoptii.size_${detail.size}`)} />
                  {detail.city ? <MetaChip label={`📍 ${detail.city}`} /> : null}
                </View>
                <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 21 }}>
                  {detail.description || t('adoptii.noDescription')}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  {t('adoptii.postedBy', {
                    name: detail.poster?.full_name || t('adoptii.anonymous'),
                  })}{' '}
                  · {dateFmt.format(new Date(detail.created_at))}
                </Text>
                {detail.posted_by !== userId && detail.status === 'available' ? (
                  <Button
                    title={t('adoptii.apply')}
                    onPress={() => {
                      setApplyFor(detail);
                      setDetail(null);
                      setApplyMessage('');
                      setApplyError(null);
                    }}
                    fullWidth
                    size="lg"
                  />
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ============ MODAL APLICĂ ============ */}
      <ApplyModal
        visible={!!applyFor}
        theme={theme}
        t={t}
        name={applyFor?.name ?? ''}
        message={applyMessage}
        setMessage={setApplyMessage}
        error={applyError}
        loading={apply.isPending}
        onSubmit={onSubmitApply}
        onClose={() => setApplyFor(null)}
      />

      {/* ============ MODAL APLICAȚIILE PRIMITE ============ */}
      <ApplicationsModal
        visible={!!appsFor}
        listing={appsFor}
        theme={theme}
        t={t}
        onClose={() => setAppsFor(null)}
        onDecide={(id, status) => setAppStatus.mutate({ id, status })}
      />

      {/* ============ MODAL ANUNȚ NOU ============ */}
      <NewListingModal
        visible={showForm}
        theme={theme}
        t={t}
        userId={userId}
        loading={createListing.isPending}
        onClose={() => setShowForm(false)}
        onCreated={() => setShowForm(false)}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Card anunț
// ============================================================

interface ListingCardProps {
  listing: AdoptionListing;
  theme: ReturnType<typeof useAppTheme>;
  t: (k: string, o?: Record<string, unknown>) => string;
  mine: boolean;
  dateLabel: string;
  onDetail: () => void;
  onApply?: () => void;
  onApps?: () => void;
  onDelete?: () => void;
  onStatus?: (s: AdoptionStatus) => void;
}

function ListingCard({ listing, theme, t, mine, dateLabel, onDetail, onApply, onApps, onDelete, onStatus }: ListingCardProps) {
  return (
    <Card>
      <Pressable onPress={onDetail}>
        {listing.photo_url ? (
          <Image source={{ uri: listing.photo_url }} style={styles.cardPhoto} contentFit="cover" />
        ) : (
          <View style={[styles.cardPhotoFallback, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={{ fontSize: 42 }}>{SPECIES_EMOJI[listing.species] ?? '🐾'}</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>
            {listing.name}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[listing.status] }]}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
              {t(`adoptii.status_${listing.status}`)}
            </Text>
          </View>
        </View>
        <View style={styles.metaWrap}>
          <MetaChip label={`${SPECIES_EMOJI[listing.species]} ${listing.species}`} theme={theme} />
          {listing.breed ? <MetaChip label={listing.breed} theme={theme} /> : null}
          <MetaChip label={ageLabel(listing.age_years, t)} theme={theme} />
          <MetaChip label={`${ADOPTION_SEX_EMOJI[listing.sex]} ${t(`adoptii.sex_${listing.sex}`)}`} theme={theme} />
          {listing.city ? <MetaChip label={`📍 ${listing.city}`} theme={theme} /> : null}
        </View>
        {listing.description ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 6 }} numberOfLines={2}>
            {listing.description}
          </Text>
        ) : null}
        <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 6 }}>
          {t('adoptii.postedBy', { name: listing.poster?.full_name || t('adoptii.anonymous') })} · {dateLabel}
        </Text>
      </Pressable>

      {mine && onStatus ? (
        <View style={styles.mineActions}>
          {ADOPTION_STATUSES.map((s) => {
            const active = listing.status === s;
            return (
              <Pressable
                key={s}
                onPress={() => onStatus(s)}
                style={[styles.statusChip, { backgroundColor: active ? STATUS_COLOR[s] : theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                  {t(`adoptii.status_${s}`)}
                </Text>
              </Pressable>
            );
          })}
          {onApps ? (
            <Pressable onPress={onApps} style={[styles.statusChip, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border }]}>
              <Ionicons name="people" size={13} color={theme.colors.primaryDark} />
              <Text style={{ color: theme.colors.primaryDark, fontSize: 11, fontWeight: '700' }}>
                {t('adoptii.seeApps')}
              </Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={8} style={styles.trashBtn}>
              <Ionicons name="trash-outline" size={17} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : !mine && listing.status === 'available' && onApply ? (
        <View style={{ marginTop: 10 }}>
          <Button title={t('adoptii.apply')} size="sm" onPress={onApply} />
        </View>
      ) : null}
    </Card>
  );
}

function MetaChip({ label, theme }: { label: string; theme?: ReturnType<typeof useAppTheme> }) {
  return (
    <View style={[styles.metaChip, theme ? { backgroundColor: theme.colors.surfaceAlt } : null]}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: theme?.colors.textMuted ?? '#555' }}>{label}</Text>
    </View>
  );
}

function APP_STATUS_BG(status: string): string {
  return status === 'accepted' ? '#16A34A' : status === 'rejected' ? '#DC2626' : status === 'withdrawn' ? '#6B7280' : '#F59E0B';
}

// ============================================================
// Modal aplicații primite
// ============================================================

function ApplicationsModal({
  visible,
  listing,
  theme,
  t,
  onClose,
  onDecide,
}: {
  visible: boolean;
  listing: AdoptionListing | null;
  theme: ReturnType<typeof useAppTheme>;
  t: (k: string, o?: Record<string, unknown>) => string;
  onClose: () => void;
  onDecide: (id: string, status: 'accepted' | 'rejected') => void;
}) {
  const { data: apps, isLoading } = useListingApplications(listing?.id ?? null);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.sheetHeader, { padding: 16 }]}>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
              {t('adoptii.appsFor', { name: listing?.name ?? '' })}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          {isLoading ? (
            <StateView loading />
          ) : !apps || apps.length === 0 ? (
            <StateView emoji="📭" title={t('adoptii.noAppsYet')} description={t('adoptii.noAppsYetHint')} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              {apps.map((a) => (
                <Card key={a.id}>
                  <View style={styles.appRow}>
                    <Avatar uri={a.applicant_avatar ?? undefined} name={a.applicant_name ?? '?'} size={40} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {a.applicant_name ?? t('adoptii.anonymous')}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={3}>
                        {a.message || t('adoptii.noMessage')}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: APP_STATUS_BG(a.status), alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                          {t(`adoptii.appStatus_${a.status}`)}
                        </Text>
                      </View>
                    </View>
                    {a.status === 'pending' ? (
                      <View style={{ gap: 6 }}>
                        <Pressable onPress={() => onDecide(a.id, 'accepted')} style={[styles.decideBtn, { backgroundColor: '#DCFCE7' }]}>
                          <Ionicons name="checkmark" size={18} color="#16A34A" />
                        </Pressable>
                        <Pressable onPress={() => onDecide(a.id, 'rejected')} style={[styles.decideBtn, { backgroundColor: '#FEE2E2' }]}>
                          <Ionicons name="close" size={18} color="#DC2626" />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Modal aplică
// ============================================================

function ApplyModal({
  visible,
  theme,
  t,
  name,
  message,
  setMessage,
  error,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  theme: ReturnType<typeof useAppTheme>;
  t: (k: string, o?: Record<string, unknown>) => string;
  name: string;
  message: string;
  setMessage: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, styles.smallSheet, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
            <View style={styles.sheetHeader}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
                {t('adoptii.applyTo', { name })}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{t('adoptii.applyHint')}</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('adoptii.messagePlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={[styles.msgInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            {error ? <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>{error}</Text> : null}
            <Button title={t('adoptii.sendApplication')} onPress={onSubmit} loading={loading} fullWidth size="lg" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Modal anunț nou
// ============================================================

function NewListingModal({
  visible,
  theme,
  t,
  userId,
  loading,
  onClose,
  onCreated,
}: {
  visible: boolean;
  theme: ReturnType<typeof useAppTheme>;
  t: (k: string) => string;
  userId: string;
  loading: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createListing = useCreateAdoptionListing();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Câine');
  const [breed, setBreed] = useState('');
  const [ageText, setAgeText] = useState('');
  const [sex, setSex] = useState<AdoptionSex>('unknown');
  const [size, setSize] = useState<AdoptionSize>('medium');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async () => {
    try {
      const picked = await pickFromGallery();
      if (picked) setImage(picked);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('adoptii.photoError'));
    }
  };

  const onSubmit = async () => {
    setFormError(null);
    const age = ageText.trim() ? Number(ageText.replace(',', '.')) : null;
    if (ageText.trim() && (age == null || Number.isNaN(age) || age < 0 || age > 50)) {
      setFormError(t('adoptii.errorAge'));
      return;
    }
    let photoUrl: string | null = null;
    if (image) {
      try {
        setUploading(true);
        photoUrl = await uploadPetPhoto(image.uri, userId, image.ext);
      } catch {
        setFormError(t('adoptii.photoError'));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    const candidate = {
      name: name.trim(),
      species,
      breed: breed.trim() || null,
      age_years: age,
      sex,
      size,
      description: description.trim() || null,
      city: city.trim() || null,
      photo_url: photoUrl,
    };
    const parsed = AdoptionListingSchema.safeParse(candidate);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('adoptii.errorGeneric'));
      return;
    }
    try {
      await createListing.mutateAsync(parsed.data as Parameters<typeof createListing.mutateAsync>[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setName(''); setBreed(''); setAgeText(''); setCity(''); setDescription(''); setImage(null);
      setSex('unknown'); setSize('medium');
      onCreated();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('adoptii.errorGeneric'));
    }
  };

  const chipStyle = (active: boolean) => [
    styles.chip,
    {
      backgroundColor: active ? theme.colors.primaryLight : theme.colors.surfaceAlt,
      borderColor: active ? theme.colors.primary : theme.colors.border,
    },
  ];
  const chipText = (active: boolean) => ({
    color: active ? theme.colors.primaryDark : theme.colors.text,
    fontSize: 12,
    fontWeight: '700' as const,
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
            <View style={styles.sheetHeader}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>
                {t('adoptii.formTitle')}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <Input label={t('adoptii.fieldName')} value={name} onChangeText={setName} placeholder={t('adoptii.namePlaceholder')} maxLength={50} />

            <View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('adoptii.fieldSpecies')}</Text>
              <View style={styles.chipWrap}>
                {SPECIES_OPTIONS.map((sp) => (
                  <Pressable key={sp} onPress={() => setSpecies(sp)} style={chipStyle(sp === species)}>
                    <Text style={{ fontSize: 13 }}>{SPECIES_EMOJI[sp]}</Text>
                    <Text style={chipText(sp === species)}>{sp}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Input label={t('adoptii.fieldBreed')} value={breed} onChangeText={setBreed} placeholder={t('adoptii.breedPlaceholder')} maxLength={50} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label={t('adoptii.fieldAge')} value={ageText} onChangeText={setAgeText} placeholder="2,5" keyboardType="decimal-pad" maxLength={5} />
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('adoptii.fieldSex')}</Text>
              <View style={styles.chipWrap}>
                {(['male', 'female', 'unknown'] as AdoptionSex[]).map((sx) => (
                  <Pressable key={sx} onPress={() => setSex(sx)} style={chipStyle(sx === sex)}>
                    <Text style={{ fontSize: 13 }}>{ADOPTION_SEX_EMOJI[sx]}</Text>
                    <Text style={chipText(sx === sex)}>{t(`adoptii.sex_${sx}`)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('adoptii.fieldSize')}</Text>
              <View style={styles.chipWrap}>
                {ADOPTION_SIZES.map((sz) => (
                  <Pressable key={sz} onPress={() => setSize(sz)} style={chipStyle(sz === size)}>
                    <Text style={chipText(sz === size)}>{t(`adoptii.size_${sz}`)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input label={t('adoptii.fieldCity')} value={city} onChangeText={setCity} placeholder={t('adoptii.cityPlaceholder')} maxLength={60} />

            <View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('adoptii.fieldDescription')}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('adoptii.descPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={1000}
                style={[styles.msgInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />
            </View>

            {/* Foto */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('adoptii.fieldPhoto')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.previewPhoto} contentFit="cover" />
                ) : (
                  <View style={[styles.previewPhoto, { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="image-outline" size={26} color={theme.colors.textMuted} />
                  </View>
                )}
                <Button title={t('adoptii.pickPhoto')} size="sm" variant="secondary" onPress={onPick} />
              </View>
            </View>

            {formError ? <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>{formError}</Text> : null}

            <Button title={t('adoptii.publish')} onPress={onSubmit} loading={loading || uploading} fullWidth size="lg" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Stiluri
// ============================================================

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  cityInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardPhotoFallback: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  trashBtn: {
    padding: 6,
    marginLeft: 'auto',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  smallSheet: {
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  msgInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
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
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  previewPhoto: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  decideBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
