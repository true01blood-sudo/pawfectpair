/**
 * Secure storage helpers pentru Expo — folosit pentru a stoca token-ul JWT
 * în Keychain (iOS) / Keystore (Android), criptat la nivel de OS.
 * Conform secțiunii 8.2 din specificație.
 */
import * as SecureStore from 'expo-secure-store';

const STORAGE_PREFIX = 'pawfectpair_';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}`);
    } catch (e) {
      console.warn('[secureStorage] getItem failed', e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}`, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (e) {
      console.warn('[secureStorage] setItem failed', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
    } catch (e) {
      console.warn('[secureStorage] removeItem failed', e);
    }
  },
};

/** Chei folosite în app */
export const STORAGE_KEYS = {
  auth: 'auth',                  // sesiune Supabase (JSON)
  themeMode: 'theme_mode',       // 'light' | 'dark' | 'system'
  failedAttempts: 'failed_attempts',
  lockoutUntil: 'lockout_until',
  draftPrefix: 'draft_',
} as const;
