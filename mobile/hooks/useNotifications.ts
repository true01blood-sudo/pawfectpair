/**
 * Hook pentru înregistrarea notificărilor push (Faza 2 — structura pregătită).
 */
import { useEffect } from 'react';
import { registerForPushNotifications } from '../lib/push';
import { useAuthStore } from '../store/auth.store';
import Constants from 'expo-constants';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '';
    if (!projectId) {
      console.warn('[notifications] Lipsă projectId în app.json → extra.eas.projectId');
      return;
    }
    registerForPushNotifications(user.id, projectId).catch(console.warn);
  }, [user]);
}
