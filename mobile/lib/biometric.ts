/**
 * Deblocare cu amprentă / Face ID — gate local, opțional (activat din
 * Profil). Nu înlocuiește autentificarea Supabase (sesiunea e deja
 * stocată în secureStorage) — doar cere biometria la fiecare deschidere
 * / revenire din background, ca un „ecran de blocare" suplimentar.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from './storage';

const BIOMETRIC_LOCK_KEY = 'biometric_lock_enabled';

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch {
    return false;
  }
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  return (await secureStorage.getItem(BIOMETRIC_LOCK_KEY)) === '1';
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await secureStorage.setItem(BIOMETRIC_LOCK_KEY, '1');
  } else {
    await secureStorage.removeItem(BIOMETRIC_LOCK_KEY);
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Deblochează Pet Care',
      cancelLabel: 'Anulează',
      disableDeviceFallback: false, // permite PIN/parolă device ca fallback dacă biometria eșuează
    });
    return result.success;
  } catch {
    return false;
  }
}
