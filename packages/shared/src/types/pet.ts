/**
 * Tipuri pentru animale de companie (tabel: pets)
 */
import type { Profile } from './profile';

export type Species = 'Câine' | 'Pisică' | 'Iepure' | 'Hamster' | 'Pasăre' | 'Alt animal';
export type PetSex = 'male' | 'female' | 'unknown';

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: Species;
  sex: PetSex;
  breed: string | null;
  birth_date: string | null;   // YYYY-MM-DD
  photo_url: string | null;
  notes: string | null;
  /** PetSOS: contact de urgență (0025_petsos.sql) */
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  /** Pedigree / carte de origine (0028_pets_pedigree_oug50.sql) */
  pedigree_registered?: boolean | null;
  pedigree_registry?: string | null;   // ex: LRC, FCI, TICA, CFA
  pedigree_number?: string | null;     // numărul din registrul de origine
  /** Cadrul legal OUG 55/2002 — câini periculoși/agresivi (0028) */
  dangerous_breed?: boolean | null;    // declarație manuală a stăpânului
  oug50_category?: number | null;      // 0 = n/a, 1 = cat. I, 2 = cat. II
  oug50_owner_18?: boolean | null;     // posesor min. 18 ani
  oug50_registration?: boolean | null; // înregistrat la poliție
  oug50_microchip?: boolean | null;    // identificat microchip
  oug50_insurance?: boolean | null;    // asigurare răspundere civilă
  oug50_sign?: boolean | null;         // afiș „Atenție câine" la poartă/ușă
  oug50_sterilized?: boolean | null;   // sterilizat
  created_at: string;
  updated_at: string;
}

export interface PetWithOwner extends Pet {
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface PetInput {
  name: string;
  species: Species;
  sex: PetSex;
  breed?: string | null;
  birth_date?: string | null;
  photo_url?: string | null;
  notes?: string | null;
  /** Pedigree (câini & pisici) */
  pedigree_registered?: boolean | null;
  pedigree_registry?: string | null;
  pedigree_number?: string | null;
  /** Cadrul legal OUG 55/2002 (câini) */
  dangerous_breed?: boolean | null;
  oug50_category?: number | null;
  oug50_owner_18?: boolean | null;
  oug50_registration?: boolean | null;
  oug50_microchip?: boolean | null;
  oug50_insurance?: boolean | null;
  oug50_sign?: boolean | null;
  oug50_sterilized?: boolean | null;
}
