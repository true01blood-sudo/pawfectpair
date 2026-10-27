/**
 * Ecran Chat — mesagerie în timp real (Supabase Realtime).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppTheme } from '../../../../components/theme-provider';
import { Avatar, Input, Button, StateView } from '../../../../components/ui';
import { useMessages, useSendMessage } from '../../../../hooks';
import { useAuthStore } from '../../../../store/auth.store';
import { SPECIES_EMOJI, timeAgoRO } from '@pawfectpair/shared';

export default function ChatScreen() {
  const { matchId, id } = useLocalSearchParams<{ matchId: string; id: string }>();
  const t = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const messages = useMessages(matchId);
  const send = useSendMessage(matchId);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  // Scroll la ultimul mesaj la primire nouă
  useEffect(() => {
    if (messages.data && messages.data.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.data?.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      await send.mutateAsync(content);
    } catch (e: any) {
      setText(content); // recuperăm textul
      alert(e?.message ?? 'Eroare la trimitere');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Conversație' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
        style={{ flex: 1 }}
      >
        {/* Header match info */}
        <View style={[styles.header, { borderBottomColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={{ color: t.colors.primary, fontSize: 24 }}>←</Text>
          </Pressable>
          <Avatar size={36} name="Companion" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeMd, fontFamily: t.typography.fontFamilyBold }}>
              Conversație match
            </Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs }}>
              {messages.realtimeConnected ? '🟢 Online' : '🔄 Conectare...'}
            </Text>
          </View>
        </View>

        <StateView loading={messages.isLoading} error={messages.error?.message}>
          <FlatList
            ref={listRef}
            data={messages.data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: t.spacing.lg, gap: 6 }}
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              return (
                <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                  <View style={[
                    styles.bubble,
                    {
                      backgroundColor: mine ? t.colors.primary : t.colors.surfaceAlt,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                    },
                  ]}>
                    <Text style={{ color: mine ? t.colors.textInverse : t.colors.text, fontSize: t.typography.fontSizeMd }}>
                      {item.content}
                    </Text>
                    <Text style={{ color: mine ? 'rgba(255,255,255,0.7)' : t.colors.textMuted, fontSize: 9, marginTop: 2, alignSelf: 'flex-end' }}>
                      {timeAgoRO(item.created_at)}{mine && item.read_at ? ' · citit' : ''}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 48 }}>👋</Text>
                <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold, marginTop: 8 }}>
                  Spune salut!
                </Text>
                <Text style={{ color: t.colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                  Trimite primul mesaj în conversația cu companionul tău.
                </Text>
              </View>
            }
          />
        </StateView>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: t.colors.surface, borderTopColor: t.colors.border }]}>
          <Input
            value={text}
            onChangeText={setText}
            placeholder="Scrie un mesaj..."
            multiline
            style={{ flex: 1, minHeight: 40, maxHeight: 100 }}
            onSubmitEditing={handleSend}
          />
          <Button title="Trimite" onPress={handleSend} loading={send.isPending} disabled={!text.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1 },
});
