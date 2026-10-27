/**
 * Validare Zod pentru moduleul PetGuardian (zone sigure + pings GPS).
 * VALIDARE DUBLĂ: client-side aici + check constraints în DB (0021_petguardian.sql).
 */
import { z } from 'zod';

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;
export const ZONE_RADIUS_MIN_M = 50;
export const ZONE_RADIUS_MAX_M = 5000;
export const ZONE_NAME_MAX = 40;
export const ALERT_MESSAGE_MAX = 280;

export const GuardianZoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Numele zonei trebuie să aibă minim 2 caractere')
    .max(ZONE_NAME_MAX, `Numele zonei poate avea maxim ${ZONE_NAME_MAX} caractere`),
  center_lat: z
    .number({ invalid_type_error: 'Latitudine invalidă' })
    .min(LAT_MIN, 'Latitudine în afara intervalului (-90..90)')
    .max(LAT_MAX, 'Latitudine în afara intervalului (-90..90)'),
  center_lng: z
    .number({ invalid_type_error: 'Longitudine invalidă' })
    .min(LNG_MIN, 'Longitudine în afara intervalului (-180..180)')
    .max(LNG_MAX, 'Longitudine în afara intervalului (-180..180)'),
  radius_m: z
    .number({ invalid_type_error: 'Raza trebuie să fie un număr' })
    .int('Raza trebuie să fie un număr întreg')
    .min(ZONE_RADIUS_MIN_M, `Raza minimă este ${ZONE_RADIUS_MIN_M} metri`)
    .max(ZONE_RADIUS_MAX_M, `Raza maximă este ${ZONE_RADIUS_MAX_M} metri`),
  active: z.boolean().optional().default(true),
});

export const GuardianPingSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  lat: z
    .number({ invalid_type_error: 'Latitudine invalidă' })
    .min(LAT_MIN, 'Latitudine în afara intervalului')
    .max(LAT_MAX, 'Latitudine în afara intervalului'),
  lng: z
    .number({ invalid_type_error: 'Longitudine invalidă' })
    .min(LNG_MIN, 'Longitudine în afara intervalului')
    .max(LNG_MAX, 'Longitudine în afara intervalului'),
  source: z.enum(['gps', 'manual', 'simulated'], {
    errorMap: () => ({ message: 'Sursa ping-ului este invalidă' }),
  }),
});

export const GuardianAlertSchema = z.object({
  pet_id: z.string().uuid('ID animal invalid'),
  zone_id: z.string().uuid('ID zonă invalid').nullable(),
  type: z.enum(['exit_zone', 'enter_zone', 'sos'], {
    errorMap: () => ({ message: 'Tip alertă invalid' }),
  }),
  message: z.string().max(ALERT_MESSAGE_MAX, `Mesajul poate avea maxim ${ALERT_MESSAGE_MAX} caractere`),
});
