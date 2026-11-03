/**
 * Hook pentru înregistrarea notificărilor push (Faza 2 — structura pregătită)
 * + hooks pentru ecranul de notificări in-app (public.notifications).
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registerForPushNotifications } from '../lib/push';
import { queries } from '../lib/supabase/queries';
import { useAuthStore } from '../store/auth.store';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.id).catch(console.warn);
  }, [user]);
}

export const NOTIFICATIONS_KEY = (uid: string) => ['notifications', uid] as const;
export const UNREAD_NOTIFICATIONS_KEY = (uid: string) => ['notifications', 'unread-count', uid] as const;

export function useNotificationsList() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: NOTIFICATIONS_KEY(uid),
    queryFn: () => queries.fetchNotifications(uid),
    enabled: !!uid,
  });
}

export function useUnreadNotificationsCount() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: UNREAD_NOTIFICATIONS_KEY(uid),
    queryFn: () => queries.fetchUnreadNotificationsCount(uid),
    enabled: !!uid,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (id: string) => queries.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(uid) });
      qc.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_KEY(uid) });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: () => queries.markAllNotificationsRead(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(uid) });
      qc.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_KEY(uid) });
    },
  });
}
