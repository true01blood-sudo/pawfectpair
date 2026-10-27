/**
 * Tipuri pentru profil utilizator (tabel: profiles)
 * Partajat între web și mobil pentru consistență.
 */

export type Provider = 'email' | 'google' | 'facebook' | 'apple';

export interface Profile {
  id: string;            // = auth.users.id
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;    // ISO timestamp
  updated_at: string;
}

export interface ProfileInput {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}
