import type { MedicalType } from '../types/medical';

export const MEDICAL_TYPE_OPTIONS = [
  'vaccination',
  'treatment',
  'surgery',
  'checkup',
  'allergy',
  'other',
] as const;

export const MEDICAL_TYPE_LABELS: Record<MedicalType, string> = {
  vaccination: 'Vaccinare',
  treatment: 'Tratament',
  surgery: 'Intervenție',
  checkup: 'Control',
  allergy: 'Alergie',
  other: 'Altul',
};

export const MEDICAL_TYPE_EMOJI: Record<MedicalType, string> = {
  vaccination: '💉',
  treatment: '💊',
  surgery: '🏥',
  checkup: '🩺',
  allergy: '🤧',
  other: '📋',
};

/** Câte zile înainte de scadență afișăm ca „aproape" */
export const UPCOMING_DAYS_THRESHOLD = 30;
