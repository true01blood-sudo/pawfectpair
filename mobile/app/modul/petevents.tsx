/**
 * Modulul PetEvents — evenimente pentru animale de companie.
 * Membrii publică evenimente (meetup, zi de adopție, competiții, workshop,
 * expo, caritabil); comunitatea confirmă participarea (RSVP going/maybe).
 *
 * Tab-uri: Explorează | Evenimentele mele
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
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card, StateView } from '../../components/ui';
import {
  EVENT_TYPES,
  EVENT_TYPE_EMOJI,
  EVENT_AUDIENCES,
  EVENT_AUDIENCE_EMOJI,
  type EventType,
  type EventAudience,
  type EventRsvpStatus,
  type EventStatus,
  type PetEventWithRefs,
  type EventParticipantWithProfile,
} from '@pawfectpair/shared';
import {
  filterEvents,
  sortEvents,
  isEventOngoing,
  isEventUpcoming,
  eventDurationHours,
} from '@pawfectpair/shared';
import { PetEventSchema } from '@pawfectpair/shared';
import { toDateInput } from '@pawfectpair/shared';
import {
  useEvents,
  useMyEvents,
  useMyRsvps,
  useEventsRefreshOnFocus,
  useCreateEvent,
  useUpdateEvent,
  useSetEventStatus,
  useDeleteEvent,
  useSetEventRsvp,
} from '../../hooks/useEvents';
import { pickFromGallery, type PickedImage } from '../../lib/image-picker';
import { uploadPetPhoto, fetchEventParticipants } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';

type TabId = 'explore' | 'mine';

/** Tipul funcției de traducere (compatibil react-i18next v15) */
type TFn = ReturnType<typeof useTranslation>['t'];

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
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

function fmtTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso.slice(11, 16);
  }
}

interface EventFormState {
  title: string;
  event_type: EventType;
  audience: EventAudience;
  city: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  max_participants: string;
  phone: string;
  description: string;
  photo_url: string | null;
}

function emptyForm(): EventFormState {
  return {
    title: '',
    event_type: 'meetup',
    audience: 'all',
    city: '',
    location: '',
    startDate: toDateInput(),
    startTime: '10:00',
    endDate: toDateInput(),
    endTime: '14:00',
    max_participants: '',
    phone: '',
    description: '',
    photo_url: null,
  };
}

function eventToForm(e: PetEventWithRefs): EventFormState {
  const start = new Date(e.starts_at);
  const end = new Date(e.ends_at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    title: e.title,
    event_type: e.event_type,
    audience: e.audience,
    city: e.city,
    location: e.location ?? '',
    startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    max_participants: e.max_participants != null ? String(e.max_participants) : '',
    phone: e.contact_phone ?? '',
    description: e.description ?? '',
    photo_url: e.photo_url,
  };
}

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
              contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' }}
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

/** Badge stadiu eveniment: în desfășurare / trecut / anulat */
function StageBadge({
  event,
  theme,
  t,
}: {
  event: PetEventWithRefs;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
}) {
  const now = new Date();
  let label = '';
  let color = theme.colors.success;
  if (event.status === 'cancelled') {
    label = t('events.cancelled_badge');
    color = theme.colors.danger;
  } else if (isEventOngoing(event, now)) {
    label = t('events.ongoing_badge');
    color = theme.colors.primary;
  } else if (!isEventUpcoming(event, now)) {
    label = t('events.past_badge');
    color = theme.colors.textMuted;
  } else {
    return null;
  }
  return (
    <View style={[styles.stageBadge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={{ color, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
        {label}
      </Text>
    </View>
  );
}

/** Badge RSVP-ul meu */
function RsvpBadge({
  status,
  theme,
  t,
}: {
  status: EventRsvpStatus | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
}) {
  if (!status) return null;
  const label =
    status === 'going' ? t('events.rsvp_going')
    : status === 'maybe' ? t('events.rsvp_maybe')
    : '';
  if (!label) return null;
  return (
    <View style={[styles.stageBadge, { backgroundColor: theme.colors.success + '22', borderColor: theme.colors.success }]}>
      <Text style={{ color: theme.colors.success, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
        ✓ {label}
      </Text>
    </View>
  );
}

// ============================================================
// Card eveniment (explore)
// ============================================================

function EventCard({
  event,
  theme,
  t,
  locale,
  myRsvp,
  onOpen,
  onRsvp,
}: {
  event: PetEventWithRefs;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  myRsvp: EventRsvpStatus | null;
  onOpen: () => void;
  onRsvp: (status: EventRsvpStatus) => void;
}) {
  const dur = eventDurationHours(event);
  const spotsText =
    event.max_participants != null
      ? t('events.going_count_max', { n: event.participant_count ?? 0, max: event.max_participants })
      : t('events.going_count', { n: event.participant_count ?? 0 });

  return (
    <Card style={styles.cardGap}>
      <TouchableOpacity activeOpacity={0.85} onPress={onOpen}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={{ fontSize: 22 }}>{EVENT_TYPE_EMOJI[event.event_type]}</Text>
            <View style={styles.cardTitleText}>
              <Text
                style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold }}
                numberOfLines={2}
              >
                {event.title}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }} numberOfLines={1}>
                📍 {event.city}{event.location ? ` · ${event.location}` : ''}
              </Text>
            </View>
            <StageBadge event={event} theme={theme} t={t} />
          </View>
        </View>

        {event.photo_url ? (
          <Image
            source={{ uri: event.photo_url }}
            style={{ width: '100%', height: 140, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm }}
            contentFit="cover"
          />
        ) : null}

        <View style={styles.wrapRow}>
          <View style={[styles.serviceChip, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyMedium }}>
              {EVENT_TYPE_EMOJI[event.event_type]} {t(`events.type_${event.event_type}`)}
            </Text>
          </View>
          <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              {EVENT_AUDIENCE_EMOJI[event.audience]} {t(`events.aud_${event.audience}`)}
            </Text>
          </View>
          <RsvpBadge status={myRsvp} theme={theme} t={t} />
        </View>

        <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium, marginTop: theme.spacing.sm }}>
          🗓️ {fmtDateTime(event.starts_at, locale)}
          {event.ends_at.slice(0, 10) === event.starts_at.slice(0, 10)
            ? ` – ${fmtTime(event.ends_at, locale)}`
            : ` → ${fmtDateTime(event.ends_at, locale)}`}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, marginTop: 2 }}>
          ⏱️ {t('events.hours_count', { n: dur })} · 👥 {spotsText}
          {event.organizer?.full_name ? ` · ${t('events.organizer')}: ${event.organizer.full_name}` : ''}
        </Text>

        {event.description ? (
          <Text
            style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: theme.spacing.sm }}
            numberOfLines={2}
          >
            {event.description}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
        {myRsvp ? (
          <>
            <Button
              title={t('events.rsvp_going')}
              size="sm"
              variant={myRsvp === 'going' ? 'primary' : 'outline'}
              onPress={() => onRsvp('going')}
              style={{ flex: 1 }}
            />
            <Button
              title={t('events.rsvp_maybe')}
              size="sm"
              variant={myRsvp === 'maybe' ? 'primary' : 'outline'}
              onPress={() => onRsvp('maybe')}
              style={{ flex: 1 }}
            />
            <Button
              title={t('events.rsvp_no')}
              size="sm"
              variant="danger"
              onPress={() => onRsvp('cancelled')}
              style={{ flex: 1 }}
            />
          </>
        ) : (
          <>
            <Button title={t('events.rsvp_join')} size="sm" onPress={() => onRsvp('going')} style={{ flex: 1 }} />
            <Button title={t('events.rsvp_maybe')} size="sm" variant="outline" onPress={() => onRsvp('maybe')} style={{ flex: 1 }} />
            <Button title={t('events.details')} size="sm" variant="outline" onPress={onOpen} style={{ flex: 1 }} />
          </>
        )}
      </View>
    </Card>
  );
}

// ============================================================
// Modal detaliu eveniment
// ============================================================

function EventDetailModal({
  visible,
  event,
  myRsvp,
  theme,
  t,
  locale,
  onClose,
  onRsvp,
}: {
  visible: boolean;
  event: PetEventWithRefs | null;
  myRsvp: EventRsvpStatus | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  onClose: () => void;
  onRsvp: (status: EventRsvpStatus) => void;
}) {
  if (!event) return <Modal visible={false} transparent />;
  const dur = eventDurationHours(event);
  const spotsText =
    event.max_participants != null
      ? t('events.going_count_max', { n: event.participant_count ?? 0, max: event.max_participants })
      : t('events.going_count', { n: event.participant_count ?? 0 });

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('events.detail_title')} theme={theme}>
      {event.photo_url ? (
        <Image
          source={{ uri: event.photo_url }}
          style={{ width: '100%', height: 160, borderRadius: theme.radius.md }}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.wrapRow}>
        <View style={[styles.serviceChip, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyMedium }}>
            {EVENT_TYPE_EMOJI[event.event_type]} {t(`events.type_${event.event_type}`)}
          </Text>
        </View>
        <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            {EVENT_AUDIENCE_EMOJI[event.audience]} {t(`events.aud_${event.audience}`)}
          </Text>
        </View>
        <StageBadge event={event} theme={theme} t={t} />
      </View>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
        {event.title}
      </Text>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm }}>
        🗓️ {fmtDateTime(event.starts_at, locale)} → {fmtDateTime(event.ends_at, locale)}
      </Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
        ⏱️ {t('events.hours_count', { n: dur })} · 👥 {spotsText}
      </Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm }}>
        📍 {event.city}{event.location ? ` · ${event.location}` : ''}
      </Text>
      {event.organizer?.full_name ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {t('events.organizer')}: {event.organizer.full_name}
        </Text>
      ) : null}

      {event.description ? (
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm }}>
          {event.description}
        </Text>
      ) : null}

      {event.status === 'published' && (
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
            {t('events.rsvp_question')}
          </Text>
          <View style={styles.actionsRow}>
            <Button
              title={`✓ ${t('events.rsvp_going')}`}
              size="sm"
              variant={myRsvp === 'going' ? 'primary' : 'outline'}
              onPress={() => onRsvp('going')}
              style={{ flex: 1 }}
            />
            <Button
              title={`? ${t('events.rsvp_maybe')}`}
              size="sm"
              variant={myRsvp === 'maybe' ? 'primary' : 'outline'}
              onPress={() => onRsvp('maybe')}
              style={{ flex: 1 }}
            />
            <Button
              title={t('events.rsvp_no')}
              size="sm"
              variant="danger"
              onPress={() => onRsvp('cancelled')}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {event.contact_phone && (
        <Button
          title={`📞 ${t('events.call_organizer')}`}
          variant="outline"
          onPress={() =>
            RNAlert.alert(t('events.call_organizer'), event.contact_phone ?? '', [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('events.call_now'), onPress: () => Linking.openURL(`tel:${event.contact_phone}`).catch(() => {}) },
            ])
          }
          fullWidth
        />
      )}
    </ModalShell>
  );
}

// ============================================================
// Modal participanți (organizator)
// ============================================================

function ParticipantsModal({
  visible,
  event,
  theme,
  t,
  onClose,
}: {
  visible: boolean;
  event: PetEventWithRefs | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  onClose: () => void;
}) {
  const [participants, setParticipants] = useState<EventParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!visible || !event) return;
    setLoading(true);
    fetchEventParticipants(event.id)
      .then((rows) => setParticipants(rows))
      .catch(() => setParticipants([]))
      .finally(() => setLoading(false));
  }, [visible, event]);

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('events.participants_title')} theme={theme}>
      {event && (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {EVENT_TYPE_EMOJI[event.event_type]} {event.title} · {event.city}
        </Text>
      )}
      {loading ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {t('common.loading')}
        </Text>
      ) : participants.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {t('events.participants_none')}
        </Text>
      ) : (
        participants.map((p) => (
          <View key={p.id} style={[styles.participantRow, { borderColor: theme.colors.border }]}>
            <Text style={{ fontSize: 20 }}>
              {p.status === 'going' ? '✅' : '❓'}
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, flex: 1 }} numberOfLines={1}>
              {p.profile?.full_name ?? `#${p.user_id.slice(0, 8)}`}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              {p.status === 'going' ? t('events.rsvp_going') : t('events.rsvp_maybe')}
            </Text>
          </View>
        ))
      )}
    </ModalShell>
  );
}

// ============================================================
// Modal formular eveniment (creare/editare)
// ============================================================

function EventFormModal({
  visible,
  existing,
  theme,
  t,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  existing: PetEventWithRefs | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  onClose: () => void;
  onSave: (state: EventFormState) => void;
  saving: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<EventFormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setForm(existing ? eventToForm(existing) : emptyForm());
      setErrors({});
    }
  }, [visible, existing]);

  function set<K extends keyof EventFormState>(k: K, v: EventFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
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
      RNAlert.alert(t('events.photo_err_title'), t('events.photo_err_msg'));
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 3) e.title = t('events.err_title_short');
    if (form.city.trim().length < 2) e.city = t('events.err_city_short');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) e.startDate = t('events.err_dates');
    if (!/^\d{2}:\d{2}$/.test(form.startTime)) e.startTime = t('events.err_dates');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.endDate)) e.endDate = t('events.err_dates');
    if (!/^\d{2}:\d{2}$/.test(form.endTime)) e.endTime = t('events.err_dates');
    if (form.phone.trim() && !/^[+0-9 ()\-.]{8,20}$/.test(form.phone.trim())) e.phone = t('events.err_phone');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSave(form);
  }

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(form.startDate) && /^\d{2}:\d{2}$/.test(form.startTime)
    && /^\d{4}-\d{2}-\d{2}$/.test(form.endDate) && /^\d{2}:\d{2}$/.test(form.endTime);
  let durationHint = '';
  if (dateOk) {
    const start = new Date(`${form.startDate}T${form.startTime}:00`).getTime();
    const end = new Date(`${form.endDate}T${form.endTime}:00`).getTime();
    if (end > start) {
      const h = Math.round(((end - start) / 3600000) * 10) / 10;
      durationHint = h < 48
        ? t('events.hours_count', { n: h })
        : t('events.days_count', { n: Math.round((h / 24) * 10) / 10 });
    }
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={existing ? t('events.form_title_edit') : t('events.form_title_new')} theme={theme}>
      <Input label={t('events.f_title')} placeholder={t('events.f_title_ph')} value={form.title} onChangeText={(v) => set('title', v)} maxLength={80} error={errors.title} />

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('events.f_type')}
      </Text>
      <View style={styles.wrapRow}>
        {EVENT_TYPES.map((tp) => (
          <Chip
            key={tp}
            label={`${EVENT_TYPE_EMOJI[tp]} ${t(`events.type_${tp}`)}`}
            active={form.event_type === tp}
            onPress={() => set('event_type', tp)}
            theme={theme}
          />
        ))}
      </View>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('events.f_audience')}
      </Text>
      <View style={styles.wrapRow}>
        {EVENT_AUDIENCES.map((a) => (
          <Chip
            key={a}
            label={`${EVENT_AUDIENCE_EMOJI[a]} ${t(`events.aud_${a}`)}`}
            active={form.audience === a}
            onPress={() => set('audience', a)}
            theme={theme}
          />
        ))}
      </View>

      <View style={styles.inlineRow}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Input label={t('events.f_city')} placeholder={t('events.f_city_ph')} value={form.city} onChangeText={(v) => set('city', v)} maxLength={60} error={errors.city} />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Input label={t('events.f_location')} placeholder={t('events.f_location_ph')} value={form.location} onChangeText={(v) => set('location', v)} maxLength={120} />
        </View>
      </View>

      <View style={styles.inlineRow}>
        <View style={{ flex: 1 }}>
          <Input label={t('events.f_start_date')} placeholder={toDateInput()} value={form.startDate} onChangeText={(v) => set('startDate', v)} maxLength={10} error={errors.startDate} />
          <Input label={t('events.f_start_time')} placeholder="10:00" value={form.startTime} onChangeText={(v) => set('startTime', v)} maxLength={5} error={errors.startTime} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label={t('events.f_end_date')} placeholder={toDateInput()} value={form.endDate} onChangeText={(v) => set('endDate', v)} maxLength={10} error={errors.endDate} />
          <Input label={t('events.f_end_time')} placeholder="14:00" value={form.endTime} onChangeText={(v) => set('endTime', v)} maxLength={5} error={errors.endTime} />
        </View>
      </View>
      {durationHint ? (
        <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
          ⏱️ {durationHint}
        </Text>
      ) : null}

      <View style={styles.inlineRow}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Input label={t('events.f_max')} placeholder={t('events.f_max_ph')} value={form.max_participants} onChangeText={(v) => set('max_participants', v.replace(/[^0-9]/g, ''))} maxLength={4} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Input label={t('events.f_phone')} placeholder={t('events.f_phone_ph')} value={form.phone} onChangeText={(v) => set('phone', v)} maxLength={20} keyboardType="phone-pad" error={errors.phone} />
        </View>
      </View>

      <Input label={t('events.f_desc')} placeholder={t('events.f_desc_ph')} value={form.description} onChangeText={(v) => set('description', v)} maxLength={1000} multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} />

      <View style={styles.photoRow}>
        {form.photo_url ? (
          <Image source={{ uri: form.photo_url }} style={styles.photoPlaceholder} contentFit="cover" />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ fontSize: 24 }}>🖼️</Text>
          </View>
        )}
        <Button title={form.photo_url ? t('events.photo_changing') : t('events.photo_pick')} size="sm" variant="outline" loading={uploading} onPress={handlePhoto} />
      </View>

      <Button title={t('common.save')} onPress={submit} loading={saving} fullWidth size="lg" />
    </ModalShell>
  );
}

// ============================================================
// Ecran principal
// ============================================================

export default function PetEventsScreen() {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ro';

  const [tab, setTab] = useState<TabId>('explore');
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [audience, setAudience] = useState<EventAudience | null>(null);
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [detailFor, setDetailFor] = useState<PetEventWithRefs | null>(null);
  const [participantsFor, setParticipantsFor] = useState<PetEventWithRefs | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState<PetEventWithRefs | null>(null);

  useEventsRefreshOnFocus();

  const eventsQ = useEvents({ eventType, audience });
  const myEventsQ = useMyEvents();
  const myRsvpsQ = useMyRsvps();

  const createEventM = useCreateEvent();
  const updateEventM = useUpdateEvent();
  const setStatusM = useSetEventStatus();
  const deleteEventM = useDeleteEvent();
  const rsvpM = useSetEventRsvp();

  const rsvpByEvent = useMemo(() => {
    const map = new Map<string, EventRsvpStatus>();
    for (const r of myRsvpsQ.data ?? []) {
      if (r.status !== 'cancelled') map.set(r.event_id, r.status);
    }
    return map;
  }, [myRsvpsQ.data]);

  const visibleEvents = useMemo(() => {
    const sorted = sortEvents(eventsQ.data ?? []);
    const filtered = filterEvents(sorted, { search, city: null });
    if (!onlyMine) return filtered;
    return filtered.filter((e) => rsvpByEvent.has(e.id));
  }, [eventsQ.data, search, onlyMine, rsvpByEvent]);

  const myEvents = useMemo(() => sortEvents(myEventsQ.data ?? []), [myEventsQ.data]);

  function handleRsvp(event: PetEventWithRefs, status: EventRsvpStatus) {
    rsvpM.mutate(
      { event_id: event.id, status },
      {
        onSuccess: () => {
          RNAlert.alert(t('events.rsvp_ok_title'), t('events.rsvp_ok_msg'));
        },
        onError: (e: Error) => {
          RNAlert.alert(t('events.rsvp_err_title'), e.message ?? t('events.rsvp_err_msg'));
        },
      }
    );
  }

  async function handleSaveEvent(form: EventFormState) {
    const payload = {
      title: form.title.trim(),
      event_type: form.event_type,
      audience: form.audience,
      city: form.city.trim(),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      starts_at: new Date(`${form.startDate}T${form.startTime}:00`).toISOString(),
      ends_at: new Date(`${form.endDate}T${form.endTime}:00`).toISOString(),
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      contact_phone: form.phone.trim() || null,
      photo_url: form.photo_url,
    };
    try {
      const parsed = PetEventSchema.safeParse(payload);
      if (!parsed.success) {
        RNAlert.alert(t('events.form_err_title'), parsed.error.issues[0]?.message ?? t('events.form_err_msg'));
        return;
      }
      if (editing) {
        await updateEventM.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createEventM.mutateAsync(payload);
      }
      setFormModal(false);
      setEditing(null);
      setTab('mine');
      RNAlert.alert(t('events.created_ok_title'), t('events.created_ok_msg'));
    } catch (e: any) {
      RNAlert.alert(t('events.form_err_title'), e?.message ?? t('events.form_err_msg'));
    }
  }

  const errEvents = eventsQ.error ? (eventsQ.error as Error).message : null;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'explore', label: t('events.tab_explore') },
    { id: 'mine', label: t('events.tab_mine') },
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
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'explore' && (
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
            {t('events.intro')}
          </Text>

          {/* Filtre tip eveniment */}
          <View style={styles.wrapRow}>
            <Chip label={t('events.type_all')} active={eventType === null} onPress={() => setEventType(null)} theme={theme} />
            {EVENT_TYPES.map((tp) => (
              <Chip
                key={tp}
                label={`${EVENT_TYPE_EMOJI[tp]} ${t(`events.type_${tp}`)}`}
                active={eventType === tp}
                onPress={() => setEventType(eventType === tp ? null : tp)}
                theme={theme}
              />
            ))}
          </View>

          {/* Filtre public */}
          <View style={styles.wrapRow}>
            <Chip label={t('events.aud_all')} active={audience === null} onPress={() => setAudience(null)} theme={theme} />
            {EVENT_AUDIENCES.map((a) => (
              <Chip
                key={a}
                label={`${EVENT_AUDIENCE_EMOJI[a]} ${t(`events.aud_${a}`)}`}
                active={audience === a}
                onPress={() => setAudience(audience === a ? null : a)}
                theme={theme}
              />
            ))}
            <Chip label={`✓ ${t('events.only_mine')}`} active={onlyMine} onPress={() => setOnlyMine(!onlyMine)} theme={theme} />
          </View>

          <Input
            label={t('events.search_label')}
            placeholder={t('events.search_ph')}
            value={search}
            onChangeText={setSearch}
            maxLength={60}
          />

          <View style={{ gap: theme.spacing.md }}>
            <StateView loading={eventsQ.isLoading} error={errEvents} empty={!errEvents && visibleEvents.length === 0} emoji="🎪" title={t('events.none_title')} description={t('events.none_desc')}>
              {visibleEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  theme={theme}
                  t={t}
                  locale={locale}
                  myRsvp={rsvpByEvent.get(ev.id) ?? null}
                  onOpen={() => setDetailFor(ev)}
                  onRsvp={(st) => handleRsvp(ev, st)}
                />
              ))}
            </StateView>
            {errEvents ? (
              <Button title={t('common.retry')} variant="outline" onPress={() => eventsQ.refetch()} />
            ) : null}
          </View>
        </ScrollView>
      )}

      {tab === 'mine' && (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <SectionTitle text={t('events.mine_title')} theme={theme} />

          {(myEventsQ.data ?? []).length === 0 && (
            <Card>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.md }}>
                {t('events.mine_pitch')}
              </Text>
              <Button title={t('events.mine_pitch_cta')} onPress={() => { setEditing(null); setFormModal(true); }} fullWidth />
            </Card>
          )}

          <StateView loading={myEventsQ.isLoading} error={myEventsQ.error ? (myEventsQ.error as Error).message : null} empty={(myEventsQ.data ?? []).length === 0} emoji="📅" title={t('events.mine_none_title')} description={t('events.mine_none_desc')}>
            {myEvents.map((ev) => (
              <Card key={ev.id} style={styles.cardGap}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={{ fontSize: 22 }}>{EVENT_TYPE_EMOJI[ev.event_type]}</Text>
                    <View style={styles.cardTitleText}>
                      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyBold }} numberOfLines={1}>
                        {ev.title}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                        📍 {ev.city} · {fmtDate(ev.starts_at, locale)}
                      </Text>
                    </View>
                    <StageBadge event={ev} theme={theme} t={t} />
                  </View>
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                  👥 {t('events.going_count', { n: ev.participant_count ?? 0 })}
                </Text>
                <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
                  <Button title={t('events.participants_btn')} size="sm" variant="outline" onPress={() => setParticipantsFor(ev)} style={{ flex: 1 }} />
                  <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => { setEditing(ev); setFormModal(true); }} style={{ flex: 1 }} />
                  <Button
                    title={ev.status === 'published' ? t('events.set_cancelled') : t('events.set_published')}
                    size="sm"
                    variant="outline"
                    loading={setStatusM.isPending}
                    onPress={() => setStatusM.mutate({ id: ev.id, status: ev.status === 'published' ? 'cancelled' : 'published' })}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t('common.delete')}
                    size="sm"
                    variant="danger"
                    onPress={() =>
                      RNAlert.alert(t('events.delete_confirm_title'), t('events.delete_confirm_msg'), [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.delete'), style: 'destructive', onPress: () => deleteEventM.mutate(ev.id) },
                      ])
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </StateView>

          {(myEventsQ.data ?? []).length > 0 && (
            <Button
              title={t('events.new_event')}
              onPress={() => { setEditing(null); setFormModal(true); }}
              variant="outline"
              fullWidth
            />
          )}
        </ScrollView>
      )}

      {/* FAB */}
      {tab !== 'mine' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            haptic();
            setEditing(null);
            setFormModal(true);
          }}
        >
          <Text style={{ color: theme.colors.textInverse, fontSize: 26 }}>＋</Text>
        </TouchableOpacity>
      )}

      <EventDetailModal
        visible={!!detailFor}
        event={detailFor}
        myRsvp={detailFor ? rsvpByEvent.get(detailFor.id) ?? null : null}
        theme={theme}
        t={t}
        locale={locale}
        onClose={() => setDetailFor(null)}
        onRsvp={(st) => {
          if (!detailFor) return;
          handleRsvp(detailFor, st);
        }}
      />

      <ParticipantsModal
        visible={!!participantsFor}
        event={participantsFor}
        theme={theme}
        t={t}
        onClose={() => setParticipantsFor(null)}
      />

      <EventFormModal
        visible={formModal}
        existing={editing}
        theme={theme}
        t={t}
        onClose={() => { setFormModal(false); setEditing(null); }}
        onSave={handleSaveEvent}
        saving={createEventM.isPending || updateEventM.isPending}
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
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stageBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

