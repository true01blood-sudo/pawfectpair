/**
 * Module PetGuardian — tipuri pentru GPS tracking & geofencing (zone sigure).
 * Aliniat cu schema DB: supabase/migrations/0021_petguardian.sql
 */

/** Sursa unui ping de locație */
export type PingSource = 'gps' | 'manual' | 'simulated';

/** Tip de alertă PetGuardian */
export type GuardianAlertType = 'exit_zone' | 'enter_zone' | 'sos';

/** Zonă sigură (geofence circular) definită pentru un animal */
export interface GuardianZone {
  id: string;
  pet_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  /** Raza zonei în metri (50–5000) */
  radius_m: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input pentru creare/actualizare zonă */
export interface GuardianZoneInput {
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  active?: boolean;
}

/** Ping de locație al unui animal (istoric poziții) */
export interface GuardianPing {
  id: string;
  pet_id: string;
  lat: number;
  lng: number;
  source: PingSource;
  recorded_at: string;
}

/** Input pentru înregistrarea unui ping */
export interface GuardianPingInput {
  pet_id: string;
  lat: number;
  lng: number;
  source: PingSource;
}

/** Alertă generată la trecerea graniței unei zone sau la SOS */
export interface GuardianAlert {
  id: string;
  pet_id: string;
  zone_id: string | null;
  type: GuardianAlertType;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

/** Starea curentă de urmărire a unui animal */
export interface GuardianStatus {
  lastPing: GuardianPing | null;
  /** Distanța până la centrul zonei active, în metri */
  distanceToZoneM: number | null;
  /** true = în interiorul zonei active; null = fără zonă activă sau fără ping */
  insideZone: boolean | null;
}
