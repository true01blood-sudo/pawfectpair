/**
 * Tipuri pentru fișa medicală (tabele: medical_records, weight_logs)
 */

export type MedicalType =
  | 'vaccinare'
  | 'tratament'
  | 'intervenție'
  | 'alergie'
  | 'control'
  | 'deparazitare'
  | 'altul';

export interface MedicalRecord {
  id: string;
  pet_id: string;
  type: MedicalType;
  title: string;
  record_date: string;         // YYYY-MM-DD (data evenimentului)
  due_date: string | null;     // YYYY-MM-DD (scadență, opțional)
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordInput {
  pet_id: string;
  type: MedicalType;
  title: string;
  record_date: string;
  due_date?: string | null;
  notes?: string | null;
}

export interface WeightLog {
  id: string;
  pet_id: string;
  weight_kg: number;
  measured_at: string;         // YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

export interface WeightLogInput {
  pet_id: string;
  weight_kg: number;
  measured_at: string;
  notes?: string | null;
}
