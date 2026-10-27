/**
 * Ecran PetGuardian — GPS tracking & zone sigure (geofencing).
 *
 * Funcționalități MVP:
 * - Selectare animal → hartă cu zonele sigure (cercuri) + ultimul ping
 * - Adăugare zonă la locația curentă sau centrul hărții (nume + rază)
 * - „Verifică acum" — ping GPS real + evaluare geofence
 * - „Simulare mișcare" (mod demo, fără colier): pas aleator 40–120 m
 * - Alertele generate la trecerea graniței (ieșire/intrare zonă)
 *
 * Securitate: validare Zod pe toate intrările (vezi @pawfectpair/shared),
 * RLS pe server, rate-limit alerte 1/min/animal (useCheckIn).
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView, Input } from '../../components/ui';
import { useMyPets } from '../../hooks/usePets';
import { useLocation } from '../../lib/location';
import {
  useGuardianZones,
  useLatestPing,
  useGuardianAlerts,
  useCreateGuardianZone,
  useDeleteGuardianZone,
  useToggleGuardianZone,
  useAcknowledgeAlert,
  useCheckIn,
  useGuardianTracking,
  computeGuardianStatus,
} from '../../hooks/useGuardian';
import { formatDistanceHuman, timeAgoRO, type GuardianZoneInput } from '@pawfectpair/shared';

const BUCURESTI = { latitude: 44.4268, longitude: 26.1025 };

export default function PetGuardianScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  // --- date ---
  const { data: pets, isLoading: petsLoading } = useMyPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const petId = selectedPetId ?? pets?.[0]?.id ?? undefined;

  const { data: zones, isLoading: zonesLoading } = useGuardianZones(petId);
  const { data: lastPing } = useLatestPing(petId);
  const { data: alerts } = useGuardianAlerts(petId);

  const activeZone = useMemo(() => zones?.find((z) => z.active) ?? null, [zones]);
  const status = useMemo(() => computeGuardianStatus(lastPing ?? null, zones), [lastPing, zones]);

  // --- mutații ---
  const createZone = useCreateGuardianZone();
  const deleteZone = useDeleteGuardianZone();
  const toggleZone = useToggleGuardianZone();
  const ackAlert = useAcknowledgeAlert(petId ?? '');
  const checkIn = useCheckIn();
  const tracking = useGuardianTracking(petId, activeZone);

  // --- hartă ---
  const mapRef = useRef<MapView>(null);
  const [mapCenter, setMapCenter] = useState(BUCURESTI);

  // --- formular zonă nouă ---
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneRadius, setZoneRadius] = useState(300);
  const [useMapCenter, setUseMapCenter] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // Poziția utilizatorului (pentru centrul hărții / zonă nouă)
  const { getCurrentLocation } = useLocation();

  // La deschidere, mutăm harta pe ultimul ping (dacă există)
  useEffect(() => {
    if (lastPing && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: lastPing.lat,
          longitude: lastPing.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
    }
  }, [lastPing?.id]);

  const onSubmitZone = async () => {
    if (!petId) return;
    setZoneError(null);
    let center = mapCenter;
    if (!useMapCenter) {
      const gps = await getCurrentLocation();
      if (!gps) {
        setZoneError(t('guardian.noLocation'));
        return;
      }
      center = { latitude: gps.latitude, longitude: gps.longitude };
    }
    const input: GuardianZoneInput = {
      name: zoneName.trim(),
      center_lat: center.latitude,
      center_lng: center.longitude,
      radius_m: zoneRadius,
      active: true,
    };
    try {
      await createZone.mutateAsync({ petId, input });
      setShowZoneModal(false);
      setZoneName('');
      setZoneRadius(300);
    } catch (e: any) {
      // mesajul e lizibil — vine din Zod sau din Supabase (RLS/constraints)
      setZoneError(e?.message ?? 'Eroare la salvarea zonei');
    }
  };

  const confirmDeleteZone = (zone: { id: string; name: string }) => {
    if (!petId) return;
    RNAlert.alert(
      t('guardian.deleteConfirmTitle'),
      t('guardian.deleteConfirmBody', { name: zone.name }),
      [
        { text: t('app.cancel'), style: 'cancel' },
        {
          text: t('app.delete'),
          style: 'destructive',
          onPress: () => deleteZone.mutate({ id: zone.id, petId }),
        },
      ]
    );
  };

  const onSimulate = async () => {
    await tracking.simulateMove(lastPing ?? null);
  };

  // --- stări de încărcare / gol ---
  if (petsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('guardian.title') }} />
        <StateView loading />
      </SafeAreaView>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('guardian.title') }} />
        <StateView
          emoji="🐾"
          title={t('guardian.noPets')}
          description={t('guardian.noPetsHint')}
        />
      </SafeAreaView>
    );
  }

  const statusColor =
    status.insideZone === null
      ? theme.colors.textMuted
      : status.insideZone
        ? theme.colors.success
        : theme.colors.danger;
  const statusText =
    status.insideZone === null
      ? t('guardian.statusUnknown')
      : status.insideZone
        ? t('guardian.statusSafe')
        : t('guardian.statusAlert');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('guardian.title') }} />

      {/* Selector animal */}
      <View style={[styles.petRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {t('guardian.pickPet')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {pets.map((p) => {
            const active = p.id === petId;
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
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.text,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* Status card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: statusColor, fontSize: 17, fontWeight: '800' }}>
                {statusText}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {lastPing
                  ? `${t('guardian.lastPing')}: ${timeAgoRO(lastPing.recorded_at)} · ${lastPing.source === 'simulated' ? t('guardian.sourceSimulated') : lastPing.source === 'manual' ? t('guardian.sourceManual') : t('guardian.sourceGps')}`
                  : t('guardian.neverPinged')}
              </Text>
            </View>
            {activeZone && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }}>
                  {formatDistanceHuman(status.distanceToZoneM)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                  {t('guardian.fromZone', { name: activeZone.name })}
                </Text>
              </View>
            )}
          </View>

          {/* Acțiuni */}
          <View style={styles.actionsRow}>
            <Button
              title={t('guardian.checkNow')}
              size="md"
              loading={checkIn.isPending}
              onPress={async () => {
                if (!petId) return;
                try {
                  const loc = await tracking.checkNow('manual');
                  if (!loc) RNAlert.alert(t('app.error'), tracking.lastError ?? t('guardian.noLocation'));
                } catch {
                  RNAlert.alert(t('app.error'), t('guardian.noLocation'));
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              title={t('guardian.simulate')}
              size="md"
              variant="secondary"
              loading={checkIn.isPending}
              onPress={onSimulate}
              style={{ flex: 1 }}
            />
            <Button
              title={tracking.tracking ? t('guardian.stopTracking') : t('guardian.startTracking')}
              size="md"
              variant={tracking.tracking ? 'danger' : 'secondary'}
              onPress={tracking.tracking ? tracking.stopTracking : tracking.startTracking}
              style={{ flex: 1 }}
            />
          </View>
          {tracking.lastError && (
            <Text style={{ color: theme.colors.danger, fontSize: 12, marginTop: 6 }}>
              {tracking.lastError}
            </Text>
          )}
        </Card>

        {/* Harta cu zone */}
        <View style={[styles.mapWrap, { borderColor: theme.colors.border }]}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              ...BUCURESTI,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            onRegionChangeComplete={(r) => setMapCenter({ latitude: r.latitude, longitude: r.longitude })}
            showsUserLocation
            showsMyLocationButton
          >
            {zones?.map((z) => (
              <React.Fragment key={z.id}>
                <Circle
                  center={{ latitude: z.center_lat, longitude: z.center_lng }}
                  radius={z.radius_m}
                  strokeColor={z.active ? theme.colors.primary : theme.colors.border}
                  fillColor={
                    z.active
                      ? theme.colors.primary + '26' // 15% opacitate
                      : theme.colors.border + '1A'
                  }
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: z.center_lat, longitude: z.center_lng }}
                  title={`🏠 ${z.name}`}
                  description={`${formatDistanceHuman(z.radius_m)} · ${z.active ? t('guardian.active') : t('guardian.inactive')}`}
                  pinColor={z.active ? '#FA871B' : '#9CA3AF'}
                />
              </React.Fragment>
            ))}
            {lastPing && (
              <Marker
                coordinate={{ latitude: lastPing.lat, longitude: lastPing.lng }}
                title={t('guardian.lastPing')}
                description={`${timeAgoRO(lastPing.recorded_at)}`}
              >
                <View style={[styles.pingDot, { borderColor: statusColor }]}>
                  <Text style={{ fontSize: 16 }}>🐾</Text>
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {/* Zone sigure */}
        <View style={{ gap: theme.spacing.sm }}>
          <View style={styles.sectionHeader}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
              {t('guardian.zones')}
            </Text>
            <Button
              title={t('guardian.addZone')}
              size="sm"
              onPress={() => setShowZoneModal(true)}
              leftIcon={<Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />}
            />
          </View>

          {zonesLoading && <StateView loading />}
          {zones && zones.length === 0 && (
            <Card style={{ alignItems: 'center', padding: theme.spacing.lg }}>
              <Text style={{ fontSize: 30 }}>🏠</Text>
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 6 }}>
                {t('guardian.noZones')}
              </Text>
            </Card>
          )}
          {zones?.map((z) => (
            <Card key={z.id} style={styles.zoneCard}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
                  🏠 {z.name}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {t('guardian.radiusLabel')}: {formatDistanceHuman(z.radius_m)} ·{' '}
                  {z.active ? t('guardian.active') : t('guardian.inactive')}
                </Text>
              </View>
              <Switch
                value={z.active}
                onValueChange={(v) => {
                  if (petId) toggleZone.mutate({ id: z.id, active: v, petId });
                }}
                trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              />
              <Pressable onPress={() => confirmDeleteZone(z)} hitSlop={8} style={{ marginLeft: 8 }}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
              </Pressable>
            </Card>
          ))}
        </View>

        {/* Alerte recente */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
            {t('guardian.alerts')}
          </Text>
          {(!alerts || alerts.length === 0) && (
            <Card style={{ alignItems: 'center', padding: theme.spacing.lg }}>
              <Text style={{ fontSize: 30 }}>🔔</Text>
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 6 }}>
                {t('guardian.noAlerts')}
              </Text>
            </Card>
          )}
          {alerts?.slice(0, 10).map((a) => (
            <Card key={a.id} style={styles.alertCard}>
              <Ionicons
                name={a.type === 'exit_zone' ? 'exit-outline' : a.type === 'enter_zone' ? 'enter-outline' : 'warning'}
                size={22}
                color={a.type === 'exit_zone' ? theme.colors.danger : theme.colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                  {a.message}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
                  {timeAgoRO(a.created_at)}
                </Text>
              </View>
              {!a.acknowledged && (
                <Pressable onPress={() => ackAlert.mutate(a.id)} hitSlop={8}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.primary} />
                </Pressable>
              )}
            </Card>
          ))}
        </View>

        {/* Cum funcționează */}
        <Card style={{ padding: theme.spacing.md }}>
          <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14, marginBottom: 8 }}>
            {t('guardian.howItWorks')}
          </Text>
          {(['step1', 'step2', 'step3'] as const).map((k) => (
            <View key={k} style={styles.stepRow}>
              <Ionicons name="paw" size={14} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 12.5, flex: 1 }}>
                {t(`guardian.${k}`)}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Modal zonă nouă */}
      <Modal visible={showZoneModal} animationType="slide" transparent onRequestClose={() => setShowZoneModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>
              {t('guardian.addZone')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>
              {t('guardian.addZoneHint')}
            </Text>

            <Input
              label={t('guardian.zoneName')}
              value={zoneName}
              onChangeText={setZoneName}
              placeholder={t('guardian.zoneNamePlaceholder')}
              maxLength={40}
            />

            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', marginTop: 8 }}>
              {t('guardian.radiusLabel')}: {formatDistanceHuman(zoneRadius)}
            </Text>
            <View style={styles.radiusRow}>
              {[100, 300, 500, 1000, 2000].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setZoneRadius(r)}
                  style={[
                    styles.radiusChip,
                    {
                      backgroundColor: zoneRadius === r ? theme.colors.primary : theme.colors.surfaceAlt,
                      borderColor: zoneRadius === r ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: zoneRadius === r ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '600' }}>
                    {formatDistanceHuman(r)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.centerToggle}>
              <Switch
                value={useMapCenter}
                onValueChange={setUseMapCenter}
                trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              />
              <Text style={{ color: theme.colors.text, fontSize: 13, flex: 1, marginLeft: 8 }}>
                {useMapCenter ? t('guardian.centerMap') : t('guardian.centerGps')}
              </Text>
            </View>

            {zoneError && (
              <Text style={{ color: theme.colors.danger, fontSize: 12, marginTop: 4 }}>{zoneError}</Text>
            )}

            <View style={styles.modalActions}>
              <Button
                title={t('app.cancel')}
                variant="secondary"
                size="md"
                onPress={() => {
                  setShowZoneModal(false);
                  setZoneError(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title={t('app.save')}
                size="md"
                loading={createZone.isPending}
                onPress={onSubmitZone}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  petRow: {
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  petChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    maxWidth: 160,
  },
  statusCard: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mapWrap: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  pingDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  centerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
