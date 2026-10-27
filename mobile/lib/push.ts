/**
 * Helpers pentru notificări push — Expo Notifications (FCM + APNs).
 * Conform secțiunii 11 din specificație (Faza 2 — dar structura pregătită).
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

/** Configurează comportamentul notificărilor la primire */
export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Solicită permisiuni + obține token push + îl salvează în Supabase */
export async function registerForPushNotifications(
  userId: string,
  expoProjectId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Notificările push funcționează doar pe dispozitive fizice.');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Permisiune refuzată');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: expoProjectId })).data;

  // Salvează în DB (UNIQUE pe user_id + platform)
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform: Platform.OS });
  if (error) console.warn('[push] Salvare token eșuată:', error.message);

  return token;
}

/** Șterge token-ul la logout (opțional) */
export async function unregisterPushNotifications(token: string): Promise<void> {
  await supabase.from('push_tokens').delete().eq('token', token);
}
