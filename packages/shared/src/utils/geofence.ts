/**
 * Geofencing pur — funcții matematice pentru zonele sigure PetGuardian.
 * 100% testabil, fără dependențe (merge identic pe Node / React Native / web).
 *
 * Modele de amenințare acoperite:
 * - Coordonate NaN/Infinity → tratate explicit (returnează fals / null).
 * - Spoofing GPS client-side → RLS + check constraints server-side;
 *   alertele sunt doar informatice, acțiunile kritice cer confirmare.
 */

import type { GuardianZone } from '../types/guardian';

const EARTH_RADIUS_M = 6_371_000;

/** Convertește grade în radiani */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Verifică dacă un număr e o coordonată validă (finită, nu NaN) */
function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Distanța Haversine între două puncte, în metri.
 * Puncte identice → 0; coordonate invalide → Infinity.
 */
export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !isFiniteNumber(lat1) || !isFiniteNumber(lng1) ||
    !isFiniteNumber(lat2) || !isFiniteNumber(lng2)
  ) {
    return Infinity;
  }
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Distanța de la un punct la centrul unei zone, în metri */
export function distanceToZoneCenterM(
  lat: number,
  lng: number,
  zone: Pick<GuardianZone, 'center_lat' | 'center_lng'>
): number {
  return haversineDistanceM(lat, lng, zone.center_lat, zone.center_lng);
}

/**
 * True dacă punctul e în interiorul zonei.
 * gpsAccuracyM = eroarea GPS raportată de device (se adaugă la rază —
 * evită alarme false când device-ul raportează ±20 m).
 */
export function isInsideZone(
  lat: number,
  lng: number,
  zone: Pick<GuardianZone, 'center_lat' | 'center_lng' | 'radius_m'>,
  gpsAccuracyM = 0
): boolean {
  if (!isFiniteNumber(zone.radius_m) || zone.radius_m <= 0) return false;
  const margin = Math.max(0, Math.min(gpsAccuracyM, 100));
  return distanceToZoneCenterM(lat, lng, zone) <= zone.radius_m + margin;
}

/**
 * Tranziția zonei între 2 evaluări succesive — baza generării alertelor.
 * prevInside === null (prima evaluare) → fără alertă.
 */
export function zoneTransition(
  prevInside: boolean | null,
  nowInside: boolean
): 'enter_zone' | 'exit_zone' | null {
  if (prevInside === null) return null;
  if (!prevInside && nowInside) return 'enter_zone';
  if (prevInside && !nowInside) return 'exit_zone';
  return null;
}

/** Simulare de mișcare: punct nou la bearing/dist date față de origine (mod demo PetGuardian) */
export function offsetPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number
): { lat: number; lng: number } {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng) || !isFiniteNumber(distanceM)) {
    return { lat, lng };
  }
  const δ = distanceM / EARTH_RADIUS_M;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );
  // conversie radiani → grade + normalizare longitudine în [-180, 180]
  const latDeg = (φ2 * 180) / Math.PI;
  const lngDeg = ((λ2 * 180) / Math.PI + 540) % 360 - 180;
  return { lat: latDeg, lng: lngDeg };
}

/** Formatează o distanță în metri pentru afișare: „350 m" / „1,2 km"; invalid → „—" */
export function formatDistanceHuman(m: number | null | undefined): string {
  if (m === null || m === undefined || !Number.isFinite(m)) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  const km = (m / 1000).toFixed(1).replace('.', ',');
  return `${km} km`;
}
