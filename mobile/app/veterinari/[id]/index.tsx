/**
 * Ecran detaliu cabinet veterinar — hero, badge-uri, tab-uri
 * About / Servicii / Recenzii, formular de recenzie, CTA programare.
 * Oglindește fluxul real de pe web (veterinari/[id]).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../../../components/theme-provider';
import { StateView, Button, Input } from '../../../components/ui';
import { useVetDetail, useVetServicesFull, useVetReviewsFull, useSubmitVetReview } from '../../../hooks/useVetDetail';
import { useMyPets } from '../../../hooks';
import { useAuthStore } from '../../../store/auth.store';

type Tab = 'about' | 'services' | 'reviews';
const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'Prezentare' },
  { id: 'services', label: 'Servicii' },
  { id: 'reviews', label: 'Recenzii' },
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= full ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
      ))}
    </View>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={28} color="#F59E0B" />
        </Pressable>
      ))}
    </View>
  );
}

export default function VetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('about');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const vetQ = useVetDetail(id);
  const servicesQ = useVetServicesFull(id);
  const reviewsQ = useVetReviewsFull(id);
  const myPets = useMyPets();
  const submitReview = useSubmitVetReview(id ?? '');

  const s = theme.colors;
  const sp = theme.spacing;
  const vet = vetQ.data;

  const gallery = useMemo(() => {
    if (!vet) return [];
    return [vet.photo_url, ...(vet.photos ?? [])].filter(Boolean) as string[];
  }, [vet]);

  const reviews = reviewsQ.data ?? [];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  const badges = vet
    ? [
        vet.is_licensed && { icon: 'checkmark-circle', label: 'Cabinet autorizat' },
        vet.experienced_team && { icon: 'people', label: 'Echipă cu experiență' },
        vet.modern_facility && { icon: 'business', label: 'Facilitate modernă' },
      ].filter(Boolean) as { icon: string; label: string }[]
    : [];

  function handleSubmitReview() {
    if (reviewRating < 1) return;
    submitReview.mutate(
      { rating: reviewRating, comment: reviewComment.trim() || null },
      {
        onSuccess: () => {
          setReviewRating(0);
          setReviewComment('');
          Alert.alert('Mulțumim!', 'Recenzia ta a fost publicată.');
        },
        onError: (e: Error) => Alert.alert('Eroare', e.message || 'Nu am putut trimite recenzia.'),
      }
    );
  }

  if (vetQ.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
        <StateView loading />
      </SafeAreaView>
    );
  }

  if (!vet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
        <StateView empty emoji="🏥" title="Cabinet negăsit" description="Acest cabinet nu mai există sau a fost șters." />
      </SafeAreaView>
    );
  }

  const canBook = !!user && (myPets.data?.length ?? 0) > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: vet.clinic_name }} />
      <ScrollView contentContainerStyle={{ padding: sp.lg, paddingBottom: sp.xxl + 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: s.surfaceAlt }]}>
          {gallery.length > 0 ? (
            <Image source={{ uri: gallery[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="medical" size={56} color={s.primary} style={{ opacity: 0.3 }} />
            </View>
          )}
          {gallery.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>1/{gallery.length}</Text>
            </View>
          )}
        </View>

        {gallery.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
            {gallery.slice(1).map((url, i) => (
              <Image key={i} source={{ uri: url }} style={{ width: 72, height: 56, borderRadius: 10 }} contentFit="cover" />
            ))}
          </ScrollView>
        )}

        <Text style={{ color: s.text, fontSize: 22, fontFamily: theme.typography.fontFamilyBold, marginTop: sp.md }}>
          {vet.clinic_name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {reviews.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Stars rating={avgRating} />
              <Text style={{ color: s.textMuted, fontSize: 12 }}>({reviews.length})</Text>
            </View>
          )}
          <Text style={{ color: s.textMuted, fontSize: 13 }}>
            {vet.city}{vet.address ? ` · ${vet.address}` : ''}
          </Text>
        </View>
        {vet.phone && (
          <Pressable onPress={() => Linking.openURL(`tel:${vet.phone}`)}>
            <Text style={{ color: s.primary, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 4 }}>
              {vet.phone}
            </Text>
          </Pressable>
        )}

        {badges.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {badges.map((b) => (
              <View key={b.label} style={[styles.badge, { borderColor: s.border }]}>
                <Ionicons name={b.icon as any} size={12} color={s.text} />
                <Text style={{ color: s.text, fontSize: 11, fontFamily: theme.typography.fontFamilyMedium }}>{b.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: s.surface, borderColor: s.border }]}>
          {TABS.map((tb) => (
            <Pressable
              key={tb.id}
              onPress={() => setTab(tb.id)}
              style={[styles.tabBtn, { backgroundColor: tab === tb.id ? s.primary : 'transparent' }]}
            >
              <Text style={{ color: tab === tb.id ? '#fff' : s.textMuted, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold }}>
                {tb.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'about' && (
          <View style={[styles.sectionCard, { backgroundColor: s.surface, borderColor: s.border }]}>
            <Text style={{ color: vet.bio ? s.text : s.textMuted, fontSize: 14, lineHeight: 20 }}>
              {vet.bio || 'Cabinetul nu a adăugat o descriere.'}
            </Text>
          </View>
        )}

        {tab === 'services' && (
          <View style={{ marginTop: sp.md, gap: sp.sm }}>
            <StateView
              loading={servicesQ.isLoading}
              empty={!servicesQ.isLoading && (servicesQ.data ?? []).length === 0}
              emoji="🩺"
              title="Niciun serviciu listat"
              description="Cabinetul nu a adăugat încă servicii."
            >
              {(servicesQ.data ?? []).map((srv) => (
                <View key={srv.id} style={[styles.serviceRow, { backgroundColor: s.surface, borderColor: s.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold }}>{srv.name}</Text>
                    {srv.duration_minutes && (
                      <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 2 }}>{srv.duration_minutes} minute</Text>
                    )}
                  </View>
                  <Text style={{ color: s.primary, fontSize: 14, fontFamily: theme.typography.fontFamilyBold, marginRight: 10 }}>
                    {(srv.price_cents / 100).toFixed(0)} {srv.currency}
                  </Text>
                  {user && (
                    <Pressable
                      onPress={() => router.push(`/veterinari/${id}/rezerva?serviciu=${srv.id}` as any)}
                      style={[styles.pickTimeBtn, { backgroundColor: s.primary }]}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontFamily: theme.typography.fontFamilySemibold }}>Alege o oră</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </StateView>
          </View>
        )}

        {tab === 'reviews' && (
          <View style={{ marginTop: sp.md, gap: sp.sm }}>
            <StateView
              loading={reviewsQ.isLoading}
              empty={!reviewsQ.isLoading && reviews.length === 0}
              emoji="⭐"
              title="Nicio recenzie încă"
            >
              {reviews.map((r, i) => (
                <View key={i} style={[styles.reviewRow, { backgroundColor: s.surface, borderColor: s.border }]}>
                  <Stars rating={r.rating} />
                  <Text style={{ color: s.text, fontSize: 13, fontFamily: theme.typography.fontFamilySemibold, marginTop: 4 }}>
                    {r.profiles?.full_name || 'Utilizator'}
                  </Text>
                  {r.comment && <Text style={{ color: s.textMuted, fontSize: 13, marginTop: 2 }}>{r.comment}</Text>}
                </View>
              ))}
            </StateView>

            {user && !myReview && (
              <View style={[styles.sectionCard, { backgroundColor: s.surface, borderColor: s.border, marginTop: 4 }]}>
                <Text style={{ color: s.text, fontSize: 14, fontFamily: theme.typography.fontFamilySemibold, marginBottom: 10 }}>
                  Lasă o recenzie
                </Text>
                <StarInput value={reviewRating} onChange={setReviewRating} />
                <View style={{ marginTop: 10 }}>
                  <Input
                    placeholder="Comentariu (opțional)"
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={2}
                    style={{ minHeight: 60, textAlignVertical: 'top' }}
                  />
                </View>
                <Button title="Trimite recenzia" onPress={handleSubmitReview} disabled={reviewRating < 1} loading={submitReview.isPending} />
              </View>
            )}
          </View>
        )}

        {/* Booking */}
        <View style={[styles.sectionCard, { backgroundColor: s.surface, borderColor: s.border, marginTop: sp.lg }]}>
          <Text style={{ color: s.text, fontSize: 15, fontFamily: theme.typography.fontFamilyBold, marginBottom: 8 }}>
            Programează o vizită
          </Text>
          {!user ? (
            <Text style={{ color: s.textMuted, fontSize: 13 }}>Autentifică-te pentru a programa o vizită.</Text>
          ) : (myPets.data?.length ?? 0) === 0 ? (
            <Text style={{ color: s.textMuted, fontSize: 13 }}>
              Nu ai încă niciun animal adăugat. Adaugă unul din Animalele mele.
            </Text>
          ) : (
            <Button
              title="Alege animalul și ora →"
              onPress={() => router.push(`/veterinari/${id}/rezerva` as any)}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { aspectRatio: 4 / 3, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photoCountBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  tabsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginTop: 16, gap: 4 },
  tabBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 12 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12 },
  pickTimeBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  reviewRow: { borderRadius: 12, borderWidth: 1, padding: 12 },
});
