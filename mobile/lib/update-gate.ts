/**
 * Update obligatoriu — verifică la deschiderea aplicației dacă versiunea
 * instalată e sub minimul setat de admin (app_settings.min_app_version,
 * /admin/setari pe web). Eșuează deschis: orice problemă (offline, coloane
 * lipsă înainte de migrația 0081, parsare eșuată) nu blochează userul —
 * mai bine un update ratat decât o aplicație care nu se mai deschide.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

export type UpdateGateResult = {
  required: boolean;
  message: string;
  storeUrl: string;
};

const DEFAULT_MESSAGE =
  'A apărut o versiune nouă cu îmbunătățiri importante. Actualizează aplicația ca să continui.';
const DEFAULT_ANDROID_URL = 'https://play.google.com/store/apps/details?id=app.pawfectpair.mobile';
const DEFAULT_IOS_URL = 'https://apps.apple.com/app/app.pawfectpair.mobile';

function parseVersion(v: string): number[] | null {
  const parts = v.trim().split('.').map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

/** true dacă `installed` < `minimum`, comparație numerică pe segmente (semver simplu). */
export function isVersionBelow(installed: string, minimum: string): boolean {
  const a = parseVersion(installed);
  const b = parseVersion(minimum);
  if (!a || !b) return false; // nu putem parsa -> nu blocăm
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

export async function checkUpdateRequired(): Promise<UpdateGateResult> {
  const notRequired: UpdateGateResult = { required: false, message: '', storeUrl: '' };

  try {
    const installed = Constants.expoConfig?.version;
    if (!installed) return notRequired;

    const { data, error } = await supabase
      .from('app_settings')
      .select('min_app_version, update_message, ios_store_url, android_store_url')
      .eq('id', true)
      .single();
    if (error || !data?.min_app_version) return notRequired;

    if (!isVersionBelow(installed, data.min_app_version)) return notRequired;

    const platformUrl =
      Platform.OS === 'ios'
        ? data.ios_store_url || DEFAULT_IOS_URL
        : data.android_store_url || DEFAULT_ANDROID_URL;

    return {
      required: true,
      message: data.update_message || DEFAULT_MESSAGE,
      storeUrl: platformUrl,
    };
  } catch {
    return notRequired; // offline sau orice altă eroare -> nu blocăm
  }
}
