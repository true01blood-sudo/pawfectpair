/**
 * Programările mele — unifică vet_appointments (veterinari) și
 * trainer_bookings (traineri) într-o singură listă, sortată după dată.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../../components/theme-provider';
import { StateView } from '../../components/ui';
import {
  useMyVetAppointments,
  useMyTrainerBookings,
  useCancelVetAppointment,
  useCancelTrainerBooking,
  useMyVetProfile,
  useIncomingVetAppointments,
  useSetVetAppointmentStatus,
  useIncomingTrainerBookings,
  useSetTrainerBookingStatus,
} from '../../hooks/useVetDetail';
import { useMyTrainerProfile } from '../../hooks/useEdu';
import type { IncomingVetAppointmentRow, IncomingTrainerBookingRow } from '../../lib/supabase/queries';

type Kind = 'vet' | 'trainer';
type Item = {
  kind: Kind;
  id: string;
  refId: string; // vet_id sau trainer_id, pentru navigare la profil
  title: string;
  petName: string;
  photoUrl: string | null;
  when: string;
  status: string;
  note: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  requested: 'În așteptare',
  confirmed: 'Confirmată',
  declined: 'Respinsă',
  cancelled: 'Anulată',
  completed: 'Finalizată',
};

function statusColor(status: string, theme: ReturnType<typeof useAppTheme>): string {
  if (status === 'confirmed' || status === 'completed') return theme.colors.success;
  if (status === 'declined' || status === 'cancelled') return theme.colors.danger;
  return '#F59E0B';
}

export default function MyAppointmentsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;
  const sp = theme.spacing;

  const vetAppts = useMyVetAppointments();
  const trainerBookings = useMyTrainerBookings();
  const cancelVet = useCancelVetAppointment();
  const cancelTrainer = useCancelTrainerBooking();

  const myVetProfile = useMyVetProfile();
  const incomingVetAppts = useIncomingVetAppointments(myVetProfile.data?.id);
  const setVetStatus = useSetVetAppointmentStatus(myVetProfile.data?.id ?? '');

  const myTrainerProfile = useMyTrainerProfile();
  const incomingTrainerBookings = useIncomingTrainerBookings(myTrainerProfile.data?.id);
  const setTrainerStatus = useSetTrainerBookingStatus(myTrainerProfile.data?.id ?? '');

  const loading = vetAppts.isLoading || trainerBookings.isLoading;
  const refreshing = vetAppts.isRefetching || trainerBookings.isRefetching;

  const items: Item[] = useMemo(() => {
    const vets: Item[] = (vetAppts.data ?? []).map((a) => ({
      kind: 'vet',
      id: a.id,
      refId: a.vet_id,
      title: a.vets?.clinic_name ?? 'Cabinet veterinar',
      petName: a.pets?.name ?? '',
      photoUrl: a.vets?.photo_url ?? a.pets?.photo_url ?? null,
      when: a.starts_at,
      status: a.status,
      note: a.reason,
    }));
    const trainers: Item[] = (trainerBookings.data ?? []).map((b) => ({
      kind: 'trainer',
      id: b.id,
      refId: b.trainer_id,
      title: b.edu_trainers?.display_name ?? 'Trainer',
      petName: b.pets?.name ?? '',
      photoUrl: b.edu_trainers?.photo_url ?? b.pets?.photo_url ?? null,
      when: b.requested_at,
      status: b.status,
      note: b.notes,
    }));
    return [...vets, ...trainers].sort((x, y) => new Date(y.when).getTime() - new Date(x.when).getTime());
  }, [vetAppts.data, trainerBookings.data]);

  const now = Date.now();
  const upcoming = items.filter((it) => new Date(it.when).getTime() >= now && it.status !== 'cancelled' && it.status !== 'declined');
  const past = items.filter((it) => !upcoming.includes(it));

  function handleCancel(item: Item) {
    Alert.alert('Anulează programarea', `Sigur anulezi ${item.kind === 'vet' ? 'vizita la' : 'sesiunea cu'} ${item.title}?`, [
      { text: 'Nu', style: 'cancel' },
      {
        text: 'Da, anulează',
        style: 'destructive',
        onPress: () => {
          if (item.kind === 'vet') cancelVet.mutate(item.id);
          else cancelTrainer.mutate(item.id);
        },
      },
    ]);
  }

  function onRefresh() {
    vetAppts.refetch();
    trainerBookings.refetch();
    if (myVetProfile.data) incomingVetAppts.refetch();
    if (myTrainerProfile.data) incomingTrainerBookings.refetch();
  }

  function renderItem(item: Item) {
    const canCancel = item.status === 'requested' || item.status === 'confirmed';
    return (
      <Pressable
        key={`${item.kind}-${item.id}`}
        onPress={() => router.push(`/${item.kind === 'vet' ? 'veterinari' : 'antrenori'}/${item.refId}` as any)}
        style={[styles.card, { backgroundColor: s.surface, borderColor: s.border }]}
      >
        <View style={styles.row}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: s.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name={item.kind === 'vet' ? 'medical' : 'school'} size={20} color={s.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }}>
              {item.petName ? `${item.petName} · ` : ''}
              {new Date(item.when).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.note ? (
              <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{item.note}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor(item.status, theme) }]}>
            <Text style={{ color: statusColor(item.status, theme), fontSize: 10, fontFamily: theme.typography.fontFamilyBold }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
        </View>
        {canCancel && (
          <Pressable onPress={() => handleCancel(item)} style={styles.cancelBtn} hitSlop={6}>
            <Text style={{ color: s.danger, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Anulează</Text>
          </Pressable>
        )}
      </Pressable>
    );
  }

  function renderIncomingVet(a: IncomingVetAppointmentRow) {
    return (
      <View key={a.id} style={[styles.card, { backgroundColor: s.surface, borderColor: s.border }]}>
        <View style={styles.row}>
          {a.pets?.photo_url ? (
            <Image source={{ uri: a.pets.photo_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: s.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="paw" size={18} color={s.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }} numberOfLines={1}>
              {a.pets?.name ?? 'Animal'}
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }}>
              {new Date(a.starts_at).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {a.reason ? <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{a.reason}</Text> : null}
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor(a.status, theme) }]}>
            <Text style={{ color: statusColor(a.status, theme), fontSize: 10, fontFamily: theme.typography.fontFamilyBold }}>
              {STATUS_LABEL[a.status] ?? a.status}
            </Text>
          </View>
        </View>
        {a.status === 'requested' && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Pressable onPress={() => setVetStatus.mutate({ id: a.id, status: 'confirmed' })} style={[styles.actionBtn, { backgroundColor: s.primary }]}>
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Confirmă</Text>
            </Pressable>
            <Pressable onPress={() => setVetStatus.mutate({ id: a.id, status: 'cancelled' })} style={[styles.actionBtn, { borderWidth: 1, borderColor: s.border }]}>
              <Text style={{ color: s.text, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Anulează</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  function renderIncomingTrainer(b: IncomingTrainerBookingRow) {
    return (
      <View key={b.id} style={[styles.card, { backgroundColor: s.surface, borderColor: s.border }]}>
        <View style={styles.row}>
          {b.pets?.photo_url ? (
            <Image source={{ uri: b.pets.photo_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: s.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="paw" size={18} color={s.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }} numberOfLines={1}>
              {b.pets?.name ?? 'Animal'}
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }}>
              {new Date(b.requested_at).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {b.notes ? <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{b.notes}</Text> : null}
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor(b.status, theme) }]}>
            <Text style={{ color: statusColor(b.status, theme), fontSize: 10, fontFamily: theme.typography.fontFamilyBold }}>
              {STATUS_LABEL[b.status] ?? b.status}
            </Text>
          </View>
        </View>
        {b.status === 'requested' && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Pressable onPress={() => setTrainerStatus.mutate({ id: b.id, status: 'confirmed' })} style={[styles.actionBtn, { backgroundColor: s.primary }]}>
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Confirmă</Text>
            </Pressable>
            <Pressable onPress={() => setTrainerStatus.mutate({ id: b.id, status: 'declined' })} style={[styles.actionBtn, { borderWidth: 1, borderColor: s.border }]}>
              <Text style={{ color: s.text, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Respinge</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Programările mele' }} />
      <ScrollView
        contentContainerStyle={{ padding: sp.lg, paddingBottom: sp.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[s.primary]} tintColor={s.primary} />}
      >
        <StateView
          loading={loading}
          empty={!loading && items.length === 0}
          emoji="📅"
          title="Nicio programare încă"
          description="Programările la veterinari și cererile de sesiune cu traineri apar aici."
        >
          {upcoming.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: s.text }]}>Următoare</Text>
              <View style={{ gap: sp.sm, marginBottom: sp.lg }}>{upcoming.map(renderItem)}</View>
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: s.text }]}>Istoric</Text>
              <View style={{ gap: sp.sm }}>{past.map(renderItem)}</View>
            </>
          )}
        </StateView>

        {myVetProfile.data && (
          <>
            <Text style={[styles.sectionTitle, { color: s.text, marginTop: sp.lg }]}>
              Cereri primite ({myVetProfile.data.clinic_name})
            </Text>
            {(incomingVetAppts.data ?? []).length > 0 ? (
              <View style={{ gap: sp.sm }}>{(incomingVetAppts.data ?? []).map(renderIncomingVet)}</View>
            ) : (
              <Text style={{ color: s.textMuted, fontSize: 13 }}>Nicio cerere primită.</Text>
            )}
          </>
        )}

        {myTrainerProfile.data && (
          <>
            <Text style={[styles.sectionTitle, { color: s.text, marginTop: sp.lg }]}>
              Cereri primite (profilul tău de trainer)
            </Text>
            {(incomingTrainerBookings.data ?? []).length > 0 ? (
              <View style={{ gap: sp.sm }}>{(incomingTrainerBookings.data ?? []).map(renderIncomingTrainer)}</View>
            ) : (
              <Text style={{ color: s.textMuted, fontSize: 13 }}>Nicio cerere primită.</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 44, height: 44, borderRadius: 12 },
  statusBadge: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  cancelBtn: { alignSelf: 'flex-end', marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
});
