// mobile/lib/push.ts — Înregistrare token Expo Push + salvare locație în Supabase

import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

// Alias folosit în _layout.tsx
export const setupNotifications = configurePushHandler;

// Configurare handler notificări (apelat o singură dată la init app)
export function configurePushHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Înregistrează device-ul pentru push notifications + salvează token în Supabase
export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) {
    console.warn('[push] Push notifications nu funcționează pe simulator');
    return;
  }

  // Permisiune notificări
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[push] Permisiunea pentru notificări a fost refuzată');
    return;
  }

  // Token Expo Push
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });
  const token = tokenData.data;

  // Locație (opțional — userul poate refuza)
  let lat: number | undefined;
  let lng: number | undefined;

  try {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
    }
  } catch {
    // Locația e opțională — continuăm fără ea
  }

  // Salvare în Supabase (upsert pe user_id + platform)
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS as 'ios' | 'android',
        lat,
        lng,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' },
    );

  if (error) {
    console.error('[push] Eroare salvare token:', error.message);
  } else {
    console.log('[push] Token înregistrat cu succes');
  }
}

// Actualizează locația în token (apelat la deschiderea aplicației sau la schimbare semnificativă)
export async function updatePushLocation(userId: string): Promise<void> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

    await supabase
      .from('push_tokens')
      .update({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch {
    // Silent — actualizarea locației nu e critică
  }
}

// Actualizează raza preferată de alerte (din Settings)
export async function updateNotificationRadius(
  userId: string,
  radiusKm: number,
): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ notification_radius_km: radiusKm })
    .eq('user_id', userId);
}
