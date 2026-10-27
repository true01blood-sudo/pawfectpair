/**
 * Modulul PetDay — servicii de pet-sitting, plimbare și cazare (pet-hotel).
 * Persoane fizice (sitteri) și centre specializate publică oferte;
 * stăpânii rezervă servicii pentru animalele lor.
 *
 * Tab-uri: Explorează | Rezervările mele | Ofertele mele
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
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card, StateView } from '../../components/ui';
import {
  PETDAY_SERVICES,
  PETDAY_SERVICE_EMOJI,
  PETDAY_PROVIDER_EMOJI,
  PETDAY_PRICE_UNITS,
  type PetDayService,
  type PetDayPriceUnit,
  type PetDayProviderType,
  type PetDayListing,
  type PetDayListingWithOwner,
  type PetDayBookingWithRefs,
  type PetDayBookingStatus,
  type Pet,
} from '@pawfectpair/shared';
import {
  filterPetdayListings,
  sortPetdayListings,
  sortPetdayBookings,
  bookingNights,
  bookingHours,
  canTransitionBooking,
} from '@pawfectpair/shared';
import { PetDayBookingSchema } from '@pawfectpair/shared';
import { toDateInput } from '@pawfectpair/shared';
import { useMyPets } from '../../hooks/usePets';
import {
  usePetdayListings,
  useMyPetdayListings,
  usePetdayBookingsAsOwner,
  usePetdayBookingsForMyListings,
  usePetdayRefreshOnFocus,
  useCreatePetdayListing,
  useUpdatePetdayListing,
  useSetPetdayListingActive,
  useDeletePetdayListing,
  useCreatePetdayBooking,
  useSetPetdayBookingStatus,
} from '../../hooks/usePetday';
import { pickFromGallery, type PickedImage } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';

type TabId = 'explore' | 'bookings' | 'offers';

/** Tipul funcției de traducere (compatibil react-i18next v15) */
type TFn = ReturnType<typeof useTranslation>['t'];

const PRICE_UNIT_KEY: Record<PetDayPriceUnit, string> = {
  day: 'petday.per_day',
  night: 'petday.per_night',
  hour: 'petday.per_hour',
  visit: 'petday.per_visit',
  walk: 'petday.per_walk',
};

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function fmtDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
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

const STATUS_COLOR: Record<PetDayBookingStatus, 'warning' | 'success' | 'primary' | 'danger' | 'muted'> = {
  pending: 'warning',
  accepted: 'success',
  completed: 'primary',
  rejected: 'danger',
  cancelled: 'muted',
};

// ============================================================
// Componente mici
// ============================================================

function Chip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        haptic();
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
          borderColor: active ? theme.colors.primaryDark : theme.colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: active ? theme.colors.textInverse : theme.colors.text,
          fontSize: theme.typography.fontSizeSm,
          fontFamily: active ? theme.typography.fontFamilyBold : theme.typography.fontFamilyRegular,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatusBadge({
  status,
  theme,
  label,
}: {
  status: PetDayBookingStatus;
  theme: ReturnType<typeof useAppTheme>;
  label: string;
}) {
  const color =
    STATUS_COLOR[status] === 'warning' ? theme.colors.warning
    : STATUS_COLOR[status] === 'success' ? theme.colors.success
    : STATUS_COLOR[status] === 'primary' ? theme.colors.primary
    : STATUS_COLOR[status] === 'danger' ? theme.colors.danger
    : theme.colors.textMuted;
  return (
    <View style={[styles.statusBadge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={{ color, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
        {label}
      </Text>
    </View>
  );
}

function SectionTitle({ text, theme }: { text: string; theme: ReturnType<typeof useAppTheme> }) {
  return (
    <Text
      style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSizeLg,
        fontFamily: theme.typography.fontFamilyBold,
        marginBottom: theme.spacing.sm,
      }}
    >
      {text}
    </Text>
  );
}

// ============================================================
// Card ofertă
// ============================================================

function ListingCard({
  listing,
  theme,
  t,
  locale,
  onBook,
  onCall,
}: {
  listing: PetDayListingWithOwner;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  onBook: () => void;
  onCall: () => void;
}) {
  const created = fmtDate(listing.created_at, locale);
  return (
    <Card style={styles.cardGap}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={{ fontSize: 22 }}>{PETDAY_PROVIDER_EMOJI[listing.provider_type]}</Text>
          <View style={styles.cardTitleText}>
            <Text
              style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold }}
              numberOfLines={2}
            >
              {listing.title}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              {listing.city} · {created}
            </Text>
          </View>
          {listing.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.success + '22', borderColor: theme.colors.success }]}>
              <Text style={{ color: theme.colors.success, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
                ✓ {t('petday.verified')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {listing.photo_url ? (
        <Image
          source={{ uri: listing.photo_url }}
          style={{ width: '100%', height: 140, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm }}
          contentFit="cover"
        />
      ) : null}

      {listing.description ? (
        <Text
          style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.sm }}
          numberOfLines={3}
        >
          {listing.description}
        </Text>
      ) : null}

      <View style={styles.wrapRow}>
        {listing.services.map((s: PetDayService) => (
          <View key={s} style={[styles.serviceChip, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={{ fontSize: 12 }}>{PETDAY_SERVICE_EMOJI[s]}</Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXs }}>
              {t(`petday.svc_${s}`)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.speciesRow}>
          {listing.accepts_dogs && <Text style={{ fontSize: theme.typography.fontSizeSm }}>🐕</Text>}
          {listing.accepts_cats && <Text style={{ fontSize: theme.typography.fontSizeSm }}>🐈</Text>}
          {listing.accepts_other && <Text style={{ fontSize: theme.typography.fontSizeSm }}>🐾</Text>}
          {listing.max_pets ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              · {t('petday.max_pets_line', { n: listing.max_pets })}
            </Text>
          ) : null}
        </View>
        {listing.price_from != null && (
          <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold, fontSize: theme.typography.fontSizeSm }}>
            {t('petday.price_from', { price: listing.price_from })} · {t(PRICE_UNIT_KEY[listing.price_unit])}
          </Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Button
          title={t('petday.book')}
          size="sm"
          onPress={onBook}
          style={{ flex: 1 }}
        />
        {listing.phone ? (
          <Button
            title={t('petday.call')}
            size="sm"
            variant="outline"
            onPress={onCall}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
    </Card>
  );
}

// ============================================================
// Card rezervare (stăpân sau ofertant)
// ============================================================

function BookingCard({
  booking,
  theme,
  t,
  locale,
  role,
  onStatus,
}: {
  booking: PetDayBookingWithRefs;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  role: 'owner' | 'provider';
  onStatus: (status: PetDayBookingStatus) => void;
}) {
  const nights = bookingNights(booking.starts_at, booking.ends_at);
  const hours = bookingHours(booking.starts_at, booking.ends_at);
  const title = booking.listing?.title ?? t('petday.deleted_offer');
  const petName = booking.pet?.name ?? t('petday.no_pet_line');

  const canCancel =
    role === 'owner' &&
    (booking.status === 'pending' || booking.status === 'accepted');
  const canAccept = role === 'provider' && booking.status === 'pending';
  const canComplete = role === 'provider' && booking.status === 'accepted';

  function askCancel() {
    RNAlert.alert(t('petday.cancel_confirm_title'), t('petday.cancel_confirm_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('petday.cancel_booking'), style: 'destructive', onPress: () => onStatus('cancelled') },
    ]);
  }

  return (
    <Card style={styles.cardGap}>
      <View style={styles.bookingHeader}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontFamilyBold, fontSize: theme.typography.fontSizeSm }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            🐾 {petName}
          </Text>
        </View>
        <StatusBadge status={booking.status} theme={theme} label={t(`petday.status_${booking.status}`)} />
      </View>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, marginTop: theme.spacing.xs }}>
        📅 {fmtDateTime(booking.starts_at, locale)} → {fmtDateTime(booking.ends_at, locale)}
      </Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, marginTop: 2 }}>
        {nights > 0
          ? t('petday.nights_count', { n: nights })
          : t('petday.hours_count', { n: hours })}
      </Text>

      {booking.note ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: theme.spacing.xs, fontStyle: 'italic' }} numberOfLines={3}>
          „{booking.note}"
        </Text>
      ) : null}

      {(canAccept || canComplete || canCancel) && (
        <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
          {canAccept && (
            <>
              <Button title={t('petday.accept')} size="sm" onPress={() => onStatus('accepted')} style={{ flex: 1 }} />
              <Button title={t('petday.reject')} size="sm" variant="outline" onPress={() => onStatus('rejected')} style={{ flex: 1 }} />
            </>
          )}
          {canComplete && (
            <Button title={t('petday.complete')} size="sm" onPress={() => onStatus('completed')} style={{ flex: 1 }} />
          )}
          {canCancel && (
            <Button title={t('petday.cancel_booking')} size="sm" variant="danger" onPress={askCancel} style={{ flex: 1 }} />
          )}
        </View>
      )}
    </Card>
  );
}

// ============================================================
// Modal: formular ofertă ( creare / editare )
// ============================================================

interface ListingFormState {
  title: string;
  provider_type: PetDayProviderType;
  services: PetDayService[];
  city: string;
  address: string;
  price_from: string;
  price_unit: PetDayPriceUnit;
  max_pets: string;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepts_other: boolean;
  phone: string;
  description: string;
  photo_url: string | null;
}

function emptyForm(): ListingFormState {
  return {
    title: '',
    provider_type: 'sitter',
    services: [],
    city: '',
    address: '',
    price_from: '',
    price_unit: 'day',
    max_pets: '',
    accepts_dogs: true,
    accepts_cats: true,
    accepts_other: false,
    phone: '',
    description: '',
    photo_url: null,
  };
}

function listingToForm(l: PetDayListing): ListingFormState {
  return {
    title: l.title,
    provider_type: l.provider_type,
    services: [...l.services],
    city: l.city,
    address: l.address ?? '',
    price_from: l.price_from != null ? String(l.price_from) : '',
    price_unit: l.price_unit,
    max_pets: l.max_pets != null ? String(l.max_pets) : '',
    accepts_dogs: l.accepts_dogs,
    accepts_cats: l.accepts_cats,
    accepts_other: l.accepts_other,
    phone: l.phone ?? '',
    description: l.description ?? '',
    photo_url: l.photo_url,
  };
}

function ModalShell({
  visible,
  onClose,
  title,
  theme,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  theme: ReturnType<typeof useAppTheme>;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, flex: 1 }}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.sm , maxWidth: 720, width: '100%', alignSelf: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
  theme,
  tint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  theme: ReturnType<typeof useAppTheme>;
  tint?: string;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, flex: 1 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptic();
          onChange(v);
        }}
        trackColor={{ false: theme.colors.border, true: tint ?? theme.colors.primary }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
}

function ListingFormModal({
  visible,
  existing,
  theme,
  t,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  existing: PetDayListing | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  onClose: () => void;
  onSave: (state: ListingFormState) => void;
  saving: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<ListingFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Reîncarcă datele la deschidere (creare vs. editare)
  React.useEffect(() => {
    if (visible) {
      setForm(existing ? listingToForm(existing) : emptyForm());
      setErrors({});
      setFormKey((k) => k + 1);
    }
  }, [visible, existing]);

  function set<K extends keyof ListingFormState>(k: K, v: ListingFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleService(s: PetDayService) {
    setForm((f) => ({
      ...f,
      services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s],
    }));
  }

  async function handlePhoto() {
    try {
      setUploading(true);
      const picked: PickedImage | null = await pickFromGallery();
      if (!picked) return;
      if (!user) throw new Error('auth');
      const url = await uploadPetPhoto(picked.uri, user.id, picked.ext);
      set('photo_url', url);
    } catch {
      RNAlert.alert(t('petday.photo_err_title'), t('petday.photo_err_msg'));
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 3) e.title = t('petday.err_title_short');
    if (form.city.trim().length < 2) e.city = t('petday.err_city_short');
    if (form.services.length === 0) e.services = t('petday.err_no_services');
    if (!(form.accepts_dogs || form.accepts_cats || form.accepts_other)) e.species = t('petday.err_no_species');
    if (form.price_from && (isNaN(Number(form.price_from)) || Number(form.price_from) < 0)) e.price_from = t('petday.err_price');
    if (form.max_pets && (!/^\d+$/.test(form.max_pets) || Number(form.max_pets) < 1 || Number(form.max_pets) > 50)) e.max_pets = t('petday.err_max_pets');
    if (form.phone && !/^[+()0-9\s-]{6,20}$/.test(form.phone)) e.phone = t('petday.err_phone');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={existing ? t('petday.edit_offer_title') : t('petday.new_offer')} theme={theme}>
      <Input
        key={`title-${formKey}`}
        label={t('petday.f_title')}
        placeholder={t('petday.f_title_ph')}
        value={form.title}
        onChangeText={(v) => set('title', v)}
        maxLength={80}
        error={errors.title}
      />

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('petday.f_type')}
      </Text>
      <View style={styles.wrapRow}>
        {(['sitter', 'center'] as PetDayProviderType[]).map((p) => (
          <Chip key={p} label={t(`petday.type_${p}`)} active={form.provider_type === p} onPress={() => set('provider_type', p)} theme={theme} />
        ))}
      </View>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('petday.f_services')}
      </Text>
      <View style={styles.wrapRow}>
        {PETDAY_SERVICES.map((s) => (
          <Chip key={s} label={`${PETDAY_SERVICE_EMOJI[s]} ${t(`petday.svc_${s}`)}`} active={form.services.includes(s)} onPress={() => toggleService(s)} theme={theme} />
        ))}
      </View>
      {errors.services ? <Text style={{ color: theme.colors.danger, fontSize: theme.typography.fontSizeXs }}>{errors.services}</Text> : null}

      <Input
        key={`city-${formKey}`}
        label={t('petday.f_city')}
        placeholder={t('petday.f_city_ph')}
        value={form.city}
        onChangeText={(v) => set('city', v)}
        maxLength={60}
        error={errors.city}
      />
      <Input
        key={`addr-${formKey}`}
        label={t('petday.f_address')}
        placeholder={t('petday.f_address_ph')}
        value={form.address}
        onChangeText={(v) => set('address', v)}
        maxLength={120}
      />

      <View style={styles.inlineRow}>
        <View style={{ flex: 1 }}>
          <Input
            key={`price-${formKey}`}
            label={t('petday.f_price')}
            placeholder="50"
            value={form.price_from}
            onChangeText={(v) => set('price_from', v.replace(/[^\d.]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={7}
            error={errors.price_from}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium, marginBottom: theme.spacing.xs }}>
            {t('petday.f_price_unit')}
          </Text>
          <View style={styles.wrapRow}>
            {PETDAY_PRICE_UNITS.map((u) => (
              <Chip key={u} label={t(PRICE_UNIT_KEY[u])} active={form.price_unit === u} onPress={() => set('price_unit', u)} theme={theme} />
            ))}
          </View>
        </View>
      </View>

      <Input
        key={`maxpets-${formKey}`}
        label={t('petday.f_max_pets')}
        placeholder="3"
        value={form.max_pets}
        onChangeText={(v) => set('max_pets', v.replace(/[^\d]/g, ''))}
        keyboardType="number-pad"
        maxLength={2}
        error={errors.max_pets}
        helper={t('petday.f_max_pets_helper')}
      />

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('petday.f_species')}
      </Text>
      <SwitchRow label={`${t('petday.sp_dogs')} 🐕`} value={form.accepts_dogs} onChange={(v) => set('accepts_dogs', v)} theme={theme} />
      <SwitchRow label={`${t('petday.sp_cats')} 🐈`} value={form.accepts_cats} onChange={(v) => set('accepts_cats', v)} theme={theme} />
      <SwitchRow label={`${t('petday.sp_other')} 🐾`} value={form.accepts_other} onChange={(v) => set('accepts_other', v)} theme={theme} />
      {errors.species ? <Text style={{ color: theme.colors.danger, fontSize: theme.typography.fontSizeXs }}>{errors.species}</Text> : null}

      <Input
        key={`phone-${formKey}`}
        label={t('petday.f_phone')}
        placeholder="07xx xxx xxx"
        value={form.phone}
        onChangeText={(v) => set('phone', v)}
        keyboardType="phone-pad"
        maxLength={20}
        error={errors.phone}
      />

      <Input
        key={`desc-${formKey}`}
        label={t('petday.f_desc')}
        placeholder={t('petday.f_desc_ph')}
        value={form.description}
        onChangeText={(v) => set('description', v)}
        maxLength={800}
        multiline
        numberOfLines={4}
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />

      <View style={styles.photoRow}>
        {form.photo_url ? (
          <Image source={{ uri: form.photo_url }} style={{ width: 72, height: 72, borderRadius: theme.radius.md }} contentFit="cover" />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ fontSize: 26 }}>📷</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Button title={t('petday.f_photo')} size="sm" variant="outline" onPress={handlePhoto} loading={uploading} />
          {form.photo_url ? (
            <Button title={t('petday.photo_remove')} size="sm" variant="ghost" onPress={() => set('photo_url', null)} />
          ) : null}
        </View>
      </View>

      <Button
        title={t('petday.save_offer')}
        onPress={() => {
          if (validate()) onSave(form);
        }}
        loading={saving}
        fullWidth
        size="lg"
        style={{ marginTop: theme.spacing.sm }}
      />
    </ModalShell>
  );
}

// ============================================================
// Modal: rezervare serviciu
// ============================================================

function BookingModal({
  visible,
  listing,
  pets,
  theme,
  t,
  locale,
  onClose,
  onConfirm,
  submitting,
}: {
  visible: boolean;
  listing: PetDayListingWithOwner | null;
  pets: Pet[];
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  onClose: () => void;
  onConfirm: (payload: { petId: string | null; startISO: string; endISO: string; note: string }) => void;
  submitting: boolean;
}) {
  const [petId, setPetId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (visible) {
      const tomorrow = toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setPetId(pets[0]?.id ?? null);
      setStartDate(tomorrow);
      setStartTime('09:00');
      setEndDate(tomorrow);
      setEndTime('18:00');
      setNote('');
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const preview = useMemo(() => {
    const s = new Date(`${startDate}T${startTime || '00:00'}:00`);
    const e = new Date(`${endDate}T${endTime || '00:00'}:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    return { nights: bookingNights(s.toISOString(), e.toISOString()), hours: bookingHours(s.toISOString(), e.toISOString()) };
  }, [startDate, startTime, endDate, endTime]);

  function submit() {
    const e: Record<string, string> = {};
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const timeRe = /^\d{2}:\d{2}$/;
    if (!dateRe.test(startDate) || !timeRe.test(startTime)) e.start = t('petday.err_datetime');
    if (!dateRe.test(endDate) || !timeRe.test(endTime)) e.end = t('petday.err_datetime');
    if (Object.keys(e).length === 0) {
      const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();
      const parsed = PetDayBookingSchema.safeParse({
        listing_id: listing?.id ?? '',
        pet_id: petId,
        starts_at: startISO,
        ends_at: endISO,
        note,
      });
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = String(issue.path[0] ?? '');
          e[field === 'starts_at' ? 'start' : field === 'ends_at' ? 'end' : field] = issue.message;
        }
      } else {
        onConfirm({ petId, startISO, endISO, note });
        return;
      }
    }
    setErrors(e);
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('petday.book_title')} theme={theme}>
      {listing && (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {PETDAY_PROVIDER_EMOJI[listing.provider_type]} {listing.title} · {listing.city}
        </Text>
      )}

      {pets.length > 0 && (
        <View>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
            {t('petday.pet_label')}
          </Text>
          <View style={[styles.wrapRow, { marginTop: theme.spacing.xs }]}>
            {pets.map((p) => (
              <Chip key={p.id} label={p.name} active={petId === p.id} onPress={() => setPetId(p.id)} theme={theme} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.inlineRow}>
        <View style={{ flex: 1 }}>
          <Input
            label={t('petday.start_date')}
            placeholder={toDateInput()}
            value={startDate}
            onChangeText={(v) => setStartDate(v)}
            maxLength={10}
            error={errors.start}
          />
          <Input
            label={t('petday.start_time')}
            placeholder="09:00"
            value={startTime}
            onChangeText={(v) => setStartTime(v)}
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label={t('petday.end_date')}
            placeholder={toDateInput()}
            value={endDate}
            onChangeText={(v) => setEndDate(v)}
            maxLength={10}
            error={errors.end}
          />
          <Input
            label={t('petday.end_time')}
            placeholder="18:00"
            value={endTime}
            onChangeText={(v) => setEndTime(v)}
            maxLength={5}
          />
        </View>
      </View>

      {preview && (
        <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
          {preview.nights > 0
            ? t('petday.nights_count', { n: preview.nights })
            : t('petday.hours_count', { n: preview.hours })}
        </Text>
      )}

      <Input
        label={t('petday.note_label')}
        placeholder={t('petday.note_ph')}
        value={note}
        onChangeText={(v) => setNote(v)}
        maxLength={400}
        multiline
        numberOfLines={3}
        style={{ minHeight: 70, textAlignVertical: 'top' }}
      />

      <Button title={t('petday.confirm_booking')} onPress={submit} loading={submitting} fullWidth size="lg" />
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
        {t('petday.booking_hint')}
      </Text>
    </ModalShell>
  );
}

// ============================================================
// Ecran principal
// ============================================================

export default function PetDayScreen() {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ro';

  const [tab, setTab] = useState<TabId>('explore');
  const [providerType, setProviderType] = useState<PetDayProviderType | null>(null);
  const [service, setService] = useState<PetDayService | null>(null);
  const [search, setSearch] = useState('');
  const [bookingFor, setBookingFor] = useState<PetDayListingWithOwner | null>(null);
  const [listingModal, setListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState<PetDayListing | null>(null);

  usePetdayRefreshOnFocus();

  const listingsQ = usePetdayListings({ providerType, service });
  const myPetsQ = useMyPets();
  const myListingsQ = useMyPetdayListings();
  const myBookingsQ = usePetdayBookingsAsOwner();
  const providerBookingsQ = usePetdayBookingsForMyListings();

  const createListingM = useCreatePetdayListing();
  const updateListingM = useUpdatePetdayListing();
  const toggleActiveM = useSetPetdayListingActive();
  const deleteListingM = useDeletePetdayListing();
  const createBookingM = useCreatePetdayBooking();
  const setStatusM = useSetPetdayBookingStatus();

  const pets = myPetsQ.data ?? [];

  const visibleListings = useMemo(() => {
    const sorted = sortPetdayListings(listingsQ.data ?? []);
    return filterPetdayListings(sorted, { search });
  }, [listingsQ.data, search]);

  const myBookings = useMemo(
    () => sortPetdayBookings(myBookingsQ.data ?? []),
    [myBookingsQ.data]
  );
  const providerBookings = useMemo(
    () => sortPetdayBookings(providerBookingsQ.data ?? []),
    [providerBookingsQ.data]
  );
  const pendingReceived = providerBookings.filter((b) => b.status === 'pending').length;

  function openCall(phone: string) {
    RNAlert.alert(t('petday.call'), phone, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('petday.call_now'), onPress: () => Linking.openURL(`tel:${phone}`).catch(() => {}) },
    ]);
  }

  async function handleSaveListing(form: ListingFormState) {
    const payload = {
      title: form.title.trim(),
      provider_type: form.provider_type,
      services: form.services,
      city: form.city.trim(),
      address: form.address.trim() || null,
      price_from: form.price_from ? Number(form.price_from) : null,
      price_unit: form.price_unit,
      max_pets: form.max_pets ? Number(form.max_pets) : null,
      accepts_dogs: form.accepts_dogs,
      accepts_cats: form.accepts_cats,
      accepts_other: form.accepts_other,
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      photo_url: form.photo_url,
    };
    try {
      if (editingListing) {
        await updateListingM.mutateAsync({ id: editingListing.id, input: payload });
      } else {
        await createListingM.mutateAsync(payload);
      }
      setListingModal(false);
      setEditingListing(null);
      setTab('offers');
    } catch (e: any) {
      RNAlert.alert(t('petday.form_err_title'), e?.message ?? t('petday.form_err_msg'));
    }
  }

  const errListings = listingsQ.error ? (listingsQ.error as Error).message : null;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'explore', label: t('petday.tab_explore') },
    { id: 'bookings', label: t('petday.tab_bookings') },
    { id: 'offers', label: t('petday.tab_offers') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      {/* Tab-uri */}
      <View style={[styles.tabsRow, { backgroundColor: theme.colors.background }]}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.id}
            style={[
              styles.tabBtn,
              {
                backgroundColor: tab === tb.id ? theme.colors.primary : 'transparent',
                borderColor: tab === tb.id ? theme.colors.primary : theme.colors.border,
                flex: 1,
              },
            ]}
            onPress={() => {
              haptic();
              setTab(tb.id);
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: tab === tb.id ? theme.colors.textInverse : theme.colors.text,
                fontSize: theme.typography.fontSizeXs,
                fontFamily: tab === tb.id ? theme.typography.fontFamilyBold : theme.typography.fontFamilyRegular,
              }}
            >
              {tb.label}
              {tb.id === 'offers' && pendingReceived > 0 ? ` (${pendingReceived})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'explore' && (
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
            {t('petday.intro')}
          </Text>

          {/* Filtre tip ofertant */}
          <View style={styles.wrapRow}>
            <Chip label={t('petday.filter_all')} active={providerType === null} onPress={() => setProviderType(null)} theme={theme} />
            <Chip label={`${PETDAY_PROVIDER_EMOJI.sitter} ${t('petday.type_sitter')}`} active={providerType === 'sitter'} onPress={() => setProviderType('sitter')} theme={theme} />
            <Chip label={`${PETDAY_PROVIDER_EMOJI.center} ${t('petday.type_center')}`} active={providerType === 'center'} onPress={() => setProviderType('center')} theme={theme} />
          </View>

          {/* Filtre servicii */}
          <View style={styles.wrapRow}>
            <Chip label={t('petday.svc_all')} active={service === null} onPress={() => setService(null)} theme={theme} />
            {PETDAY_SERVICES.map((s) => (
              <Chip
                key={s}
                label={`${PETDAY_SERVICE_EMOJI[s]} ${t(`petday.svc_${s}`)}`}
                active={service === s}
                onPress={() => setService(service === s ? null : s)}
                theme={theme}
              />
            ))}
          </View>

          <Input
            label={t('petday.search_label')}
            placeholder={t('petday.search_ph')}
            value={search}
            onChangeText={setSearch}
            maxLength={60}
          />

          <View style={{ gap: theme.spacing.md }}>
            <StateView loading={listingsQ.isLoading} error={errListings} empty={!errListings && visibleListings.length === 0} emoji="🏡" title={t('petday.no_listings')} description={t('petday.no_listings_desc')}>
              {visibleListings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  theme={theme}
                  t={t}
                  locale={locale}
                  onBook={() => setBookingFor(l)}
                  onCall={() => l.phone && openCall(l.phone)}
                />
              ))}
            </StateView>
            {errListings ? (
              <Button title={t('common.retry')} variant="outline" onPress={() => listingsQ.refetch()} />
            ) : null}
          </View>
        </ScrollView>
      )}

      {tab === 'bookings' && (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <SectionTitle text={t('petday.my_bookings_title')} theme={theme} />
          <StateView loading={myBookingsQ.isLoading} error={myBookingsQ.error ? (myBookingsQ.error as Error).message : null} empty={myBookings.length === 0} emoji="📋" title={t('petday.bookings_none')} description={t('petday.bookings_none_desc')}>
            {myBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                theme={theme}
                t={t}
                locale={locale}
                role="owner"
                onStatus={(st) => setStatusM.mutate({ id: b.id, status: st })}
              />
            ))}
          </StateView>
        </ScrollView>
      )}

      {tab === 'offers' && (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <SectionTitle text={t('petday.my_offers_title')} theme={theme} />

          {(myListingsQ.data ?? []).length === 0 && (
            <Card>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.md }}>
                {t('petday.offers_pitch')}
              </Text>
              <Button title={t('petday.offers_pitch_cta')} onPress={() => { setEditingListing(null); setListingModal(true); }} fullWidth />
            </Card>
          )}

          <StateView loading={myListingsQ.isLoading} error={myListingsQ.error ? (myListingsQ.error as Error).message : null} empty={(myListingsQ.data ?? []).length === 0} emoji="🏷️" title={t('petday.my_offers_none')} description={t('petday.my_offers_none_desc')}>
            {(myListingsQ.data ?? []).map((l) => (
              <Card key={l.id} style={styles.cardGap}>
                <View style={styles.bookingHeader}>
                  <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                    <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontFamilyBold, fontSize: theme.typography.fontSizeSm }} numberOfLines={1}>
                      {PETDAY_PROVIDER_EMOJI[l.provider_type]} {l.title}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                      {l.city} · {l.services.length} {t('petday.services_count')}
                    </Text>
                  </View>
                  <View style={[styles.activeBadge, { backgroundColor: l.active ? theme.colors.success + '22' : theme.colors.surfaceAlt, borderColor: l.active ? theme.colors.success : theme.colors.border }]}>
                    <Text style={{ color: l.active ? theme.colors.success : theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
                      {l.active ? t('petday.offer_active') : t('petday.offer_inactive')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
                  <Button
                    title={l.active ? t('petday.deactivate') : t('petday.activate')}
                    size="sm"
                    variant="outline"
                    loading={toggleActiveM.isPending}
                    onPress={() => toggleActiveM.mutate({ id: l.id, active: !l.active })}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t('petday.edit_offer')}
                    size="sm"
                    variant="outline"
                    onPress={() => { setEditingListing(l); setListingModal(true); }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t('common.delete')}
                    size="sm"
                    variant="danger"
                    onPress={() =>
                      RNAlert.alert(t('petday.delete_confirm_title'), t('petday.delete_confirm_msg'), [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.delete'), style: 'destructive', onPress: () => deleteListingM.mutate(l.id) },
                      ])
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </StateView>

          {(myListingsQ.data ?? []).length > 0 && (
            <Button
              title={t('petday.new_offer')}
              onPress={() => { setEditingListing(null); setListingModal(true); }}
              variant="outline"
              fullWidth
            />
          )}

          {pendingReceived > 0 && <SectionTitle text={t('petday.received_bookings')} theme={theme} />}
          <StateView loading={providerBookingsQ.isLoading} error={providerBookingsQ.error ? (providerBookingsQ.error as Error).message : null} empty={providerBookings.length === 0} emoji="📨" title={t('petday.received_none')} description={t('petday.received_none_desc')}>
            {providerBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                theme={theme}
                t={t}
                locale={locale}
                role="provider"
                onStatus={(st) => setStatusM.mutate({ id: b.id, status: st })}
              />
            ))}
          </StateView>
        </ScrollView>
      )}

      {/* FAB only pe explore + offers */}
      {tab !== 'bookings' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            haptic();
            setEditingListing(null);
            setListingModal(true);
          }}
        >
          <Text style={{ color: theme.colors.textInverse, fontSize: 26 }}>＋</Text>
        </TouchableOpacity>
      )}

      <BookingModal
        visible={!!bookingFor}
        listing={bookingFor}
        pets={pets}
        theme={theme}
        t={t}
        locale={locale}
        onClose={() => setBookingFor(null)}
        submitting={createBookingM.isPending}
        onConfirm={async ({ petId: pid, startISO, endISO, note }) => {
          if (!bookingFor) return;
          try {
            await createBookingM.mutateAsync({
              listing_id: bookingFor.id,
              pet_id: pid,
              starts_at: startISO,
              ends_at: endISO,
              note: note || null,
            });
            setBookingFor(null);
            RNAlert.alert(t('petday.booking_ok_title'), t('petday.booking_ok_msg'));
            setTab('bookings');
          } catch (e: any) {
            RNAlert.alert(t('petday.booking_err_title'), e?.message ?? t('petday.booking_err_msg'));
          }
        }}
      />

      <ListingFormModal
        visible={listingModal}
        existing={editingListing}
        theme={theme}
        t={t}
        onClose={() => { setListingModal(false); setEditingListing(null); }}
        onSave={handleSaveListing}
        saving={createListingM.isPending || updateListingM.isPending}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Stiluri
// ============================================================

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  tabBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  cardGap: { marginBottom: 0 },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitleText: { flex: 1 },
  verifiedBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  speciesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  bookingHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
});
