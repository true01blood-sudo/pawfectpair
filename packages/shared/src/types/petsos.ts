/**
 * Modul PetSOS — evenimente de urgență & contacte.
 * Aliniat cu schema DB upstream: sos_events (0013_petsos.sql);
 * extensia mobilă 0025 adaugă coloane emergency_contact_* pe pets + index.
 */

/** Tip de urgență (check constraint în DB) */
export type SosEventType = 'medical' | 'lost' | 'danger';

/** Eveniment SOS înregistrat */
export interface SosEvent {
  id: string;
  pet_id: string;
  owner_id: string;
  type: SosEventType;
  notes: string | null;
  created_at: string;
}

/** Input creare eveniment SOS (validat de SosEventSchema) */
export interface SosEventInput {
  pet_id: string;
  type: SosEventType;
  notes?: string | null;
}

/** Meta-ui pentru tipuri SOS (emoji + cheie i18n label) */
export const SOS_TYPES: SosEventType[] = ['medical', 'lost', 'danger'];

export const SOS_TYPE_EMOJI: Record<SosEventType, string> = {
  medical: '🩺',
  lost: '🔎',
  danger: '⚠️',
};

/** Ghid rapid de prim ajutor (conținut static, label-urile în i18n) */
export interface FirstAidGuide {
  id: 'bleeding' | 'poisoning' | 'heatstroke' | 'seizure' | 'choking';
  emoji: string;
}

export const FIRST_AID_GUIDES: FirstAidGuide[] = [
  { id: 'bleeding', emoji: '🩸' },
  { id: 'poisoning', emoji: '☠️' },
  { id: 'heatstroke', emoji: '🥵' },
  { id: 'seizure', emoji: '⚡' },
  { id: 'choking', emoji: '😮' },
];
