/**
 * Ecran de notificări — citește public.notifications (populat acum și la
 * mesaj nou în chat, via trigger-ul din migrația 0069). Bell-ul din Home
 * deschide acest ecran; badge-ul roșu de pe Home arată numărul de necitite.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { StateView } from '../../components/ui';
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useNotifications';
import type { NotificationRow } from '../../lib/supabase/queries';

const TYPE_ICON: Record<string, string> = {
  appointment: '🩺',
  vaccine: '💉',
  adoption: '🐾',
  event: '🎉',
  social: '💬',
  system: '⚙️',
  info: '🔔',
  emergency: '🆘',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'acum';
  if (mins < 60) return `acum ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `acum ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `acum ${days}z`;
  return new Date(dateStr).toLocaleDateString('ro-RO');
}

/**
 * Notificările au un `link` scris in format de rută web (ex:
 * /comunitate/mesaje/<matchId>, /sos) — nu are sens pe mobil, unde rutele
 * sunt altele. Traducem aici formatele cunoscute spre ecrane reale.
 */
function resolveMobileRoute(link: string | null): { pathname: string; params?: Record<string, string> } | null {
  if (!link) return null;
  const chatMatch = link.match(/^\/comunitate\/mesaje\/([^/]+)/);
  if (chatMatch) return { pathname: '/animale/chat', params: { matchId: chatMatch[1] } };
  if (link.startsWith('/sos')) return { pathname: '/modul/petsos' };
  return null;
}

export default function NotificariScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const s = theme.colors;
  const sp = theme.spacing;

  const { data, isLoading, isRefetching, refetch } = useNotificationsList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter]
  );

  function handlePress(n: NotificationRow) {
    if (!n.is_read) markRead.mutate(n.id);
    const route = resolveMobileRoute(n.link);
    if (route) router.push(route as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Notificări' }} />
      <ScrollView
        contentContainerStyle={{ padding: sp.lg, paddingBottom: sp.xxl }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[s.primary]} tintColor={s.primary} />}
      >
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setFilter('all')}
              style={[styles.tab, { backgroundColor: filter === 'all' ? s.primary : s.surface, borderColor: filter === 'all' ? s.primary : s.border }]}
            >
              <Text style={{ color: filter === 'all' ? '#fff' : s.text, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Toate</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('unread')}
              style={[styles.tab, { backgroundColor: filter === 'unread' ? s.primary : s.surface, borderColor: filter === 'unread' ? s.primary : s.border }]}
            >
              <Text style={{ color: filter === 'unread' ? '#fff' : s.text, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>
                Necitite{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </Pressable>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={() => markAllRead.mutate()} hitSlop={6}>
              <Text style={{ color: s.primary, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Marchează toate citite</Text>
            </Pressable>
          )}
        </View>

        <StateView
          loading={isLoading}
          empty={!isLoading && filtered.length === 0}
          emoji={filter === 'unread' ? '✓' : '🔔'}
          title={filter === 'unread' ? 'Nicio notificare necitită' : 'Nicio notificare încă'}
          description={filter === 'unread' ? undefined : 'Mesajele noi și actualizările apar aici.'}
        >
          <View style={{ gap: sp.sm }}>
            {filtered.map((n) => {
              const navigable = !!resolveMobileRoute(n.link);
              return (
                <Pressable
                  key={n.id}
                  onPress={() => handlePress(n)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: n.is_read ? s.surface : s.surfaceAlt,
                      borderColor: n.is_read ? s.border : s.primary,
                    },
                  ]}
                >
                  <View style={[styles.iconBubble, { backgroundColor: s.background }]}>
                    <Text style={{ fontSize: 18 }}>{TYPE_ICON[n.type] ?? '🔔'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold, flexShrink: 1 }} numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text style={{ color: s.textMuted, fontSize: 10 }}>{timeAgo(n.created_at)}</Text>
                    </View>
                    <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                      {n.body}
                    </Text>
                    {navigable && (
                      <Text style={{ color: s.primary, fontSize: 12, marginTop: 4, fontFamily: theme.typography.fontFamilySemibold }}>
                        Deschide →
                      </Text>
                    )}
                  </View>
                  {!n.is_read && <View style={[styles.dot, { backgroundColor: s.primary }]} />}
                </Pressable>
              );
            })}
          </View>
        </StateView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tab: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderWidth: 1.5, padding: 12 },
  iconBubble: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});
