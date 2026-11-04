/**
 * Tipuri pentru profil utilizator (tabel: profiles)
 * Partajat între web și mobil pentru consistență.
 */

export type Provider = 'email' | 'google' | 'facebook' | 'apple';

export type UserPlan = 'free' | 'premium';
export type PlanSource = 'promo_launch' | 'purchased' | null;

export interface Profile {
  id: string;            // = auth.users.id
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;    // ISO timestamp
  updated_at: string;
  plan: UserPlan;
  plan_source: PlanSource;
  plan_expires_at: string | null; // ISO timestamp — null = fara expirare (abonament platit activ)
}

/** Acces Premium real = plan 'premium' SI (fara expirare SAU expirarea e in viitor). */
export function hasPremiumAccess(profile: Pick<Profile, 'plan' | 'plan_expires_at'> | null | undefined): boolean {
  if (!profile || profile.plan !== 'premium') return false;
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at).getTime() > Date.now();
}

export interface ProfileInput {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}
