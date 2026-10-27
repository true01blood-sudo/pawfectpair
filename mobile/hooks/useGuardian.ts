/**
 * Hook PetGuardian — zone sigure, pings GPS, alerte geofencing.
 *
 * Tracking: la fiecare interval, obține locația, evaluează tranziția
 * inside/outside față de evaluarea anterioară și generează alertă la trecerea
 * graniței (cu rate-limit anti-spam: max 1 alertă / 60 s / animal).
 *
 * Mod demo: fără colier GPS real, „simulare mișcare" generează un ping la
 * 40–120 m în direcție aleatoare față de ultimul ping (offsetPoint).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';
import {
  isInsideZone,
  zoneTransition,
  offsetPoint,
  distanceToZoneCenterM,
  type GuardianZone,
  type GuardianPing,
  type GuardianStatus,
  type PingSource,
} from '@pawfectpair/shared';

export const GUARDIAN_ZONES_KEY = (petId: string) => ['guardian-zones', petId] as const;
export const GUARDIAN_PING_KEY = (petId: string) => ['guardian-ping', petId] as const;
export const GUARDIAN_ALERTS_KEY = (petId: string) => ['guardian-alerts', petId] as const;

const TRACKING_INTERVAL_MS = 60_000; // evaluare la fiecare minut
const ALERT_COOLDOWN_MS = 60_000;    // max 1 alertă / minut / animal

// ============================================================
// Queries CRUD
// ============================================================

export function useGuardianZones(petId: string | undefined) {
  return useQuery({
    queryKey: GUARDIAN_ZONES_KEY(petId ?? ''),
    queryFn: () => queries.fetchGuardianZones(petId!),
    enabled: !!petId,
  });
}

export function useCreateGuardianZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, input }: { petId: string; input: Parameters<typeof queries.createGuardianZone>[1] }) =>
      queries.createGuardianZone(petId, input),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: GUARDIAN_ZONES_KEY(vars.petId) }),
  });
}

export function useDeleteGuardianZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, petId }: { id: string; petId: string }) => queries.deleteGuardianZone(id),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: GUARDIAN_ZONES_KEY(vars.petId) });
      qc.invalidateQueries({ queryKey: GUARDIAN_ALERTS_KEY(vars.petId) });
    },
  });
}

export function useToggleGuardianZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active, petId }: { id: string; active: boolean; petId: string }) =>
      queries.setGuardianZoneActive(id, active),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: GUARDIAN_ZONES_KEY(vars.petId) }),
  });
}

export function useLatestPing(petId: string | undefined) {
  return useQuery({
    queryKey: GUARDIAN_PING_KEY(petId ?? ''),
    queryFn: () => queries.fetchLatestGuardianPing(petId!),
    enabled: !!petId,
  });
}

export function useGuardianAlerts(petId: string | undefined) {
  return useQuery({
    queryKey: GUARDIAN_ALERTS_KEY(petId ?? ''),
    queryFn: () => queries.fetchGuardianAlerts(petId!, 20),
    enabled: !!petId,
  });
}

export function useAcknowledgeAlert(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.acknowledgeGuardianAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: GUARDIAN_ALERTS_KEY(petId) }),
  });
}

// ============================================================
// Status derivat + tracking
// ============================================================

/** Calculează starea curentă: ultimul ping vs. prima zonă activă */
export function computeGuardianStatus(
  ping: GuardianPing | null,
  zones: GuardianZone[] | undefined
): GuardianStatus {
  const activeZone = zones?.find((z) => z.active);
  if (!ping || !activeZone) {
    return { lastPing: ping, distanceToZoneM: null, insideZone: null };
  }
  const distanceToZoneM = distanceToZoneCenterM(ping.lat, ping.lng, activeZone);
  if (!Number.isFinite(distanceToZoneM)) {
    return { lastPing: ping, distanceToZoneM: null, insideZone: null };
  }
  return {
    lastPing: ping,
    distanceToZoneM,
    insideZone: distanceToZoneM <= activeZone.radius_m,
  };
}

/** Record ping + evaluare geofence; returnează tipul de alertă generată (sau null) */
export function useCheckIn() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lastAlertAt = useRef<Record<string, number>>({});

  const mutation = useMutation({
    mutationFn: async ({
      petId,
      zone,
      coords,
      accuracy,
      source,
    }: {
      petId: string;
      zone?: GuardianZone | null;
      coords: { latitude: number; longitude: number; accuracy?: number };
      accuracy?: number;
      source: PingSource;
    }) => {
      // 1. înregistrează pingul (Zod validează coordonatele)
      const ping = await queries.recordGuardianPing({
        pet_id: petId,
        lat: coords.latitude,
        lng: coords.longitude,
        source,
      });
      // 2. evaluează geofence dacă există zonă activă
      let transition: 'enter_zone' | 'exit_zone' | null = null;
      if (zone && zone.active) {
        const nowInside = isInsideZone(coords.latitude, coords.longitude, zone, accuracy ?? 0);
        const prev = qc.getQueryData<GuardianPing | null>(GUARDIAN_PING_KEY(petId));
        const prevInside =
          prev ? isInsideZone(prev.lat, prev.lng, zone, accuracy ?? 0) : null;
        transition = zoneTransition(prevInside, nowInside);
        if (transition) {
          const now = Date.now();
          const lastAt = lastAlertAt.current[petId] ?? 0;
          if (now - lastAt >= ALERT_COOLDOWN_MS) {
            lastAlertAt.current[petId] = now;
            const verb = transition === 'exit_zone' ? 'A ieșit din zona' : 'A intrat în zona';
            await queries.createGuardianAlert(
              petId,
              zone.id,
              transition,
              `${verb} „${zone.name}"`
            );
          } else {
            transition = null; // în cooldown — nu spamuim
          }
        }
      }
      return { ping, transition };
    },
    onSuccess: (data, vars) => {
      qc.setQueryData(GUARDIAN_PING_KEY(vars.petId), data.ping);
      qc.invalidateQueries({ queryKey: GUARDIAN_ALERTS_KEY(vars.petId) });
    },
  });

  return mutation;
}

/**
 * Tracking continuu (când ecranul PetGuardian e deschis).
 * La fiecare TRACKING_INTERVAL_MS: GPS → ping → evaluare geofence → alertă.
 */
export function useGuardianTracking(petId: string | undefined, zone: GuardianZone | null) {
  const { mutateAsync } = useCheckIn();
  const [tracking, setTracking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const zoneRef = useRef<GuardianZone | null>(zone);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    zoneRef.current = zone;
  }, [zone]);

  const checkNow = useCallback(
    async (source: PingSource = 'gps'): Promise<{ latitude: number; longitude: number } | null> => {
      if (!petId || !user) return null;
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        let status = perm.status;
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') {
          setLastError('Permisiune locație refuzată');
          return null;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await mutateAsync({
          petId,
          zone: zoneRef.current,
          coords: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
          },
          accuracy: loc.coords.accuracy ?? 0,
          source,
        });
        setLastError(null);
        return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      } catch (e: any) {
        setLastError(e?.message ?? 'Eroare la verificarea locației');
        return null;
      }
    },
    [petId, user, mutateAsync]
  );

  /** Simulare mișcare (mod demo — fără colier): pas aleator 40–120 m față de ultimul ping */
  const simulateMove = useCallback(
    async (lastPing: GuardianPing | null) => {
      if (!petId || !user) return;
      const base = lastPing ?? {
        lat: 44.4268,
        lng: 26.1025,
      };
      const bearing = Math.random() * 360;
      const distance = 40 + Math.random() * 80;
      const next = offsetPoint(base.lat, base.lng, bearing, distance);
      try {
        await mutateAsync({
          petId,
          zone: zoneRef.current,
          coords: { latitude: next.lat, longitude: next.lng },
          accuracy: 10,
          source: 'simulated',
        });
        setLastError(null);
      } catch (e: any) {
        setLastError(e?.message ?? 'Eroare la simulare');
      }
    },
    [petId, user, mutateAsync]
  );

  const startTracking = useCallback(() => {
    if (!petId || intervalRef.current) return;
    setTracking(true);
    checkNow('gps').catch(() => undefined);
    intervalRef.current = setInterval(() => {
      checkNow('gps').catch(() => undefined);
    }, TRACKING_INTERVAL_MS);
  }, [petId, checkNow]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTracking(false);
  }, []);

  // cleanup la unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { tracking, lastError, checkNow, simulateMove, startTracking, stopTracking };
}
