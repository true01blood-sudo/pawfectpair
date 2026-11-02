/**
 * Hook pentru înregistrarea notificărilor push (Faza 2 — structura pregătită).
 */
import { useEffect } from 'react';
import { registerForPushNotifications } from '../lib/push';
import { useAuthStore } from '../store/auth.store';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.id).catch(console.warn);
  }, [user]);
}
