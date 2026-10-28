/**
 * Circles tab — community hub: events, groups, social
 * Design: pawfectpair-design aesthetic
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../components/theme-provider';

const CIRCLE_TABS = ['Events', 'Groups', 'Stories'] as const;

const SAMPLE_EVENTS = [
  { id: '1', title: 'Weekend pack walk', date: 'Sat · 10:00', location: 'Central Park', going: 12, category: 'walk' },
  { id: '2', title: 'Dog training class', date: 'Sun · 14:00', location: 'Training center', going: 8, category: 'training' },
  { id: '3', title: 'Pet adoption day', date: 'Sat · 09:00', location: 'City shelter', going: 25, category: 'adoption' },
];

const SAMPLE_GROUPS = [
  { id: '1', name: 'Golden Retriever owners', members: 142, icon: 'paw' },
  { id: '2', name: 'Local dog walkers', members: 89, icon: 'walk' },
  { id: '3', name: 'Cat lovers club', members: 234, icon: 'paw' },
];

export default function CercuriScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<typeof CIRCLE_TABS[number]>('Events');

  const s = theme.colors;
  const sp = theme.spacing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: sp.xxl + 16 }} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: sp.lg, paddingTop: sp.sm }]}>
          <View>
            <Text style={{ color: s.text, fontSize: 24, fontFamily: theme.typography.fontFamilyBold }}>
              Circles
            </Text>
            <Text style={{ color: s.textMuted, fontSize: 14, marginTop: 2 }}>
              Your pet community
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/comunitate')}
            style={[styles.iconBtn, { borderColor: s.border, backgroundColor: s.surface }]}
          >
            <Ionicons name="chatbubble-outline" size={20} color={s.text} />
          </Pressable>
        </View>

        {/* ── Quick actions ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: sp.lg, marginTop: sp.md, gap: 10 }}>
          <Pressable onPress={() => router.push('/(tabs)/petmatch')} style={{ flex: 1 }}>
            <View style={[styles.quickCard, { backgroundColor: s.primary }]}>
              <Ionicons name="heart" size={22} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 6 }}>
                PetMatch
              </Text>
            </View>
          </Pressable>
          <Pressable style={{ flex: 1 }}>
            <View style={[styles.quickCard, { backgroundColor: s.surface, borderColor: s.border, borderWidth: 1 }]}>
              <Ionicons name="people" size={22} color={s.primary} />
              <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 6 }}>
                Find groups
              </Text>
            </View>
          </Pressable>
          <Pressable style={{ flex: 1 }}>
            <View style={[styles.quickCard, { backgroundColor: s.surface, borderColor: s.border, borderWidth: 1 }]}>
              <Ionicons name="add-circle" size={22} color={s.primary} />
              <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 6 }}>
                Create event
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── Section tabs ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: sp.lg, marginTop: sp.lg, gap: 8 }}>
          {CIRCLE_TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabPill,
                activeTab === tab
                  ? { backgroundColor: s.primary }
                  : { backgroundColor: s.surface, borderColor: s.border, borderWidth: 1 },
              ]}
            >
              <Text style={{ color: activeTab === tab ? '#fff' : s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold }}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Events ── */}
        {activeTab === 'Events' && (
          <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md, gap: sp.md }}>
            {SAMPLE_EVENTS.map((ev) => (
              <Pressable key={ev.id}>
                <View style={[styles.eventCard, { backgroundColor: s.surface, borderColor: s.border }]}>
                  <View style={[styles.eventIcon, { backgroundColor: `${s.primary}15` }]}>
                    <Ionicons name="calendar" size={22} color={s.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: s.text, fontSize: 15, fontFamily: theme.typography.fontFamilySemibold }}>
                      {ev.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="time-outline" size={12} color={s.textMuted} />
                        <Text style={{ color: s.textMuted, fontSize: 12 }}>{ev.date}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="location-outline" size={12} color={s.textMuted} />
                        <Text style={{ color: s.textMuted, fontSize: 12 }}>{ev.location}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ color: s.textMuted, fontSize: 12 }}>{ev.going} going</Text>
                      <Pressable style={[styles.joinBtn, { backgroundColor: s.primary }]}>
                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>
                          Join
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Groups ── */}
        {activeTab === 'Groups' && (
          <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md, gap: sp.sm }}>
            {SAMPLE_GROUPS.map((g) => (
              <Pressable key={g.id}>
                <View style={[styles.groupRow, { backgroundColor: s.surface, borderColor: s.border }]}>
                  <View style={[styles.groupIcon, { backgroundColor: `${s.primary}15` }]}>
                    <Ionicons name={g.icon as any} size={20} color={s.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>
                      {g.name}
                    </Text>
                    <Text style={{ color: s.textMuted, fontSize: 12 }}>{g.members} members</Text>
                  </View>
                  <Pressable style={[styles.followBtn, { borderColor: s.primary }]}>
                    <Text style={{ color: s.primary, fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>
                      Join
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Stories ── */}
        {activeTab === 'Stories' && (
          <View style={{ paddingHorizontal: sp.lg, marginTop: sp.md }}>
            <View style={[styles.emptyState, { backgroundColor: s.surface, borderColor: s.border }]}>
              <Ionicons name="images-outline" size={40} color={s.textMuted} />
              <Text style={{ color: s.text, fontSize: 15, fontFamily: theme.typography.fontFamilySemibold, marginTop: 12 }}>
                No stories yet
              </Text>
              <Text style={{ color: s.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Share a moment with your pet community
              </Text>
              <Pressable style={[styles.shareBtn, { backgroundColor: s.primary, marginTop: 16 }]}>
                <Text style={{ color: '#fff', fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>
                  Share a story
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCard: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  shareBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
});
