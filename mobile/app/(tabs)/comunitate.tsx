/**
 * Ecran Comunitate — lista conversațiilor (matches cu mesaje).
 * Tap pe o conversație → deschide chat-ul realtime.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { Avatar, StateView } from '../../components/ui';
import { useConversations } from '../../hooks';
import { SPECIES_EMOJI, timeAgoRO, truncate } from '@pawfectpair/shared';
import type { Conversation } from '@pawfectpair/shared';

export default function ComunitateScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const convs = useConversations();

  const renderItem = ({ item }: { item: Conversation }) => (
    <Pressable
      onPress={() => router.push({ pathname: '/animale/chat', params: { matchId: item.match.id, petId: item.match.pet_a_id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderColor: t.colors.border },
      ]}
    >
      <Avatar uri={item.other_pet.photo_url} name={item.other_pet.name} size={52} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeMd, fontFamily: t.typography.fontFamilyBold, flex: 1 }} numberOfLines={1}>
            {item.other_pet.name} {SPECIES_EMOJI[item.other_pet.species as keyof typeof SPECIES_EMOJI]}
          </Text>
          {item.last_message && (
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeXs }}>
              {timeAgoRO(item.last_message.created_at)}
            </Text>
          )}
        </View>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm }} numberOfLines={1}>
          {item.last_message?.content ?? truncate('Începe conversația!', 40)}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={[styles.badge, { backgroundColor: t.colors.primary }]}>
          <Text style={{ color: t.colors.textInverse, fontSize: 10, fontWeight: '700' }}>{item.unread_count}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['top']}>
      <View style={{ padding: t.spacing.lg, paddingBottom: t.spacing.sm }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXl, fontFamily: t.typography.fontFamilyBold }}>
          Conversații
        </Text>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.fontSizeSm }}>
          Mesagerie în timp real cu matches-urile tale
        </Text>
      </View>
      <StateView
        loading={convs.isLoading}
        error={convs.error?.message}
        empty={convs.data?.length === 0}
        emptyText="Încă nu ai niciun match. Folosește PetMatch pentru a găsi companioni!"
      >
        <FlatList
          data={convs.data ?? []}
          keyExtractor={(item) => item.match.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: t.spacing.md, gap: t.spacing.sm , maxWidth: 720, width: '100%', alignSelf: 'center' }}
          refreshControl={
            <RefreshControl refreshing={convs.isRefetching} onRefresh={() => convs.refetch()} colors={[t.colors.primary]} tintColor={t.colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      </StateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
