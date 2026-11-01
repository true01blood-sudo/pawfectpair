/**
 * Tipuri pentru fișa medicală (tabele: medical_records, weight_logs)
 */

// Valorile trebuie să corespundă exact constrângerii CHECK din DB
// (supabase/migrations/0010_petwell.sql — medical_records.type).
export type MedicalType =
  | 'vaccination'
  | 'treatment'
  | 'surgery'
  | 'checkup'
  | 'allergy'
  | 'other';

export interface MedicalRecord {
  id: string;
  pet_id: string;
  type: MedicalType;
  title: string;
  record_date: string;         // YYYY-MM-DD (data evenimentului)
  next_due_date: string | null; // YYYY-MM-DD (scadență, opțional)
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordInput {
  pet_id: string;
  type: MedicalType;
  title: string;
  record_date: string;
  next_due_date?: string | null;
  notes?: string | null;
}

export interface WeightLog {
  id: string;
  pet_id: string;
  weight_kg: number;
  logged_at: string;           // YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

export interface WeightLogInput {
  pet_id: string;
  weight_kg: number;
  logged_at: string;
  notes?: string | null;
}
