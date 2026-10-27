import type { MedicalType } from '../types/medical';

export const MEDICAL_TYPE_OPTIONS = [
  'vaccinare',
  'tratament',
  'intervenție',
  'alergie',
  'control',
  'deparazitare',
  'altul',
] as const;

export const MEDICAL_TYPE_LABELS: Record<MedicalType, string> = {
  vaccinare: 'Vaccinare',
  tratament: 'Tratament',
  intervenție: 'Intervenție',
  alergie: 'Alergie',
  control: 'Control',
  deparazitare: 'Deparazitare',
  altul: 'Altul',
};

export const MEDICAL_TYPE_EMOJI: Record<MedicalType, string> = {
  vaccinare: '💉',
  tratament: '💊',
  intervenție: '🏥',
  alergie: '🤧',
  control: '🩺',
  deparazitare: '🛡️',
  altul: '📋',
};

/** Câte zile înainte de scadență afișăm ca „aproape" */
export const UPCOMING_DAYS_THRESHOLD = 30;
