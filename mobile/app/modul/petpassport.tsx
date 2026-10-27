/**
 * PetPassport — pașaport & travel wallet (R03).
 * Design: conform mockup "Luna's passport" — microchip, EU Pet Passport,
 * Document sections, Document validity, Open travel pack CTA.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { usePets } from '../../hooks/usePets';

type PassportSection = {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  route?: string;
};

const PASSPORT_SECTIONS: PassportSection[] = [
  { id: 'identity', icon: 'person-circle-outline', titleKey: 'passport.secIdentity', descKey: 'passport.secIdentityDesc' },
  { id: 'vaccinations', icon: 'medical-outline', titleKey: 'passport.secVaccinations', descKey: 'passport.secVaccinationsDesc' },
  { id: 'travel_docs', icon: 'document-outline', titleKey: 'passport.secTravelDocs', descKey: 'passport.secTravelDocsDesc' },
  { id: 'trip', icon: 'airplane-outline', titleKey: 'passport.secTrip', descKey: 'passport.secTripDesc' },
];

type ValidityItem = {
  id: string;
  label: string;
  detail: string;
  validUntil?: string;
  status: 'valid' | 'warning' | 'expired';
};

const DEMO_VALIDITY: ValidityItem[] = [
  { id: 'microchip', label: 'Microchip înregistrat', detail: 'Sursa: AMICUS', status: 'valid' },
  { id: 'rabies', label: 'Vaccinare antirabică', detail: 'Valabilă până 14 Oct 2027', status: 'valid' },
  { id: 'health_cert', label: 'Certificat sănătate (EU)', detail: 'Valabil până 28 Nov 2026', status: 'valid' },
];

export default function PetPassportScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { pets, loading } = usePets();
  const [selectedPetIdx, setSelectedPetIdx] = useState(0);

  const selectedPet = pets?.[selectedPetIdx];

  function statusColor(s: ValidityItem['status']) {
    if (s === 'valid') return '#16A34A';
    if (s === 'warning') return '#D97706';
    return '#DC2626';
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: theme.typography.fontFamilyBold }}>
          {t('passport.title', 'Pașaport & travel')}
        </Text>
        <Pressable hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Selector animale */}
        {pets && pets.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, flexDirection: 'row', paddingVertical: 12 }}>
            {pets.map((p: any, idx: number) => (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPetIdx(idx)}
                style={[styles.petChip, {
                  backgroundColor: selectedPetIdx === idx ? theme.colors.primary : theme.colors.surface,
                  borderColor: selectedPetIdx === idx ? theme.colors.primary : theme.colors.border,
                }]}
              >
                <Text style={{ fontSize: 18 }}>{p.species === 'cat' ? '🐱' : p.species === 'horse' ? '🐴' : '🐶'}</Text>
                <Text style={{ color: selectedPetIdx === idx ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Hero card animal */}
        <View style={[styles.heroCard, { marginHorizontal: 20, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Foto cover */}
          <View style={[styles.heroCover, { backgroundColor: theme.colors.accent }]}>
            <Text style={{ fontSize: 64 }}>
              {selectedPet?.species === 'cat' ? '🐱' : selectedPet?.species === 'horse' ? '🐴' : '🐕'}
            </Text>
            <Pressable style={[styles.changePhotoBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11 }}>Schimbă poza</Text>
            </Pressable>
          </View>

          {/* Info */}
          <View style={{ padding: 16 }}>
            <View style={styles.petInfoRow}>
              <View>
                <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: theme.typography.fontFamilyBold }}>
                  {selectedPet?.name ?? 'Luna'}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                  {selectedPet?.breed ?? 'Golden Retriever'} · {selectedPet?.gender === 'female' ? 'Femelă' : 'Mascul'} · 3 ani
                </Text>
              </View>
              <View style={[styles.microchipBadge, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                <Ionicons name="hardware-chip-outline" size={13} color="#0284C7" />
                <View>
                  <Text style={{ color: '#0284C7', fontSize: 10 }}>Microchip</Text>
                  <Text style={{ color: '#0284C7', fontSize: 11, fontWeight: '700' }}>•••• 4821</Text>
                </View>
              </View>
            </View>
          </View>

          {/* EU Pet Passport */}
          <View style={[styles.passportDoc, { margin: 16, marginTop: 0, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <View style={styles.passportDocLeft}>
              <Text style={{ fontSize: 32 }}>🛂</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Document oficial</Text>
              <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>
                EU Pet Passport (CH)
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                Copie stocată · PDF (6 pag.)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </View>
        </View>

        {/* Secțiuni document */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold, marginBottom: 12 }}>
            {t('passport.docSections', 'Secțiuni document')}
          </Text>
          {PASSPORT_SECTIONS.map((sec) => (
            <Pressable
              key={sec.id}
              style={[styles.sectionRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.background }]}>
                <Ionicons name={sec.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>
                  {t(sec.titleKey, sec.id)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {t(sec.descKey, '')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Trip activ */}
        <View style={[styles.tripCard, { marginHorizontal: 20, marginTop: 20, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="airplane" size={20} color="#2563EB" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1E3A5F', fontWeight: '700', fontSize: 14 }}>
                {t('passport.tripActive', 'Trip: Elveția → Italia')}
              </Text>
              <Text style={{ color: '#3B82F6', fontSize: 12 }}>
                28 Nov – 2 Dec 2026
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
          </View>
        </View>

        {/* Valabilitate documente */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={styles.validityHeader}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: theme.typography.fontFamilyBold }}>
              {t('passport.docValidity', 'Valabilitate documente')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              {t('passport.lastChecked', 'Verificat: 10 Nov 2026')}
            </Text>
          </View>
          {DEMO_VALIDITY.map((item) => (
            <View key={item.id} style={[styles.validityRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Ionicons
                name={item.status === 'valid' ? 'checkmark-circle' : 'warning'}
                size={20}
                color={statusColor(item.status)}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
                <Text style={{ color: statusColor(item.status), fontSize: 12 }}>{item.detail}</Text>
              </View>
              <Text style={{ color: statusColor(item.status), fontSize: 12, fontWeight: '600' }}>
                {item.status === 'valid' ? t('passport.valid', 'Valid') : t('passport.expiring', 'Expiră')}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* CTA Open travel pack */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Pressable style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}>
          <Ionicons name="airplane" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {t('passport.openTravelPack', '✈ Deschide pachetul de călătorie')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 12,
  },
  petChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  heroCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  heroCover: { height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  changePhotoBtn: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
  },
  petInfoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  microchipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 10, padding: 8,
  },
  passportDoc: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  passportDocLeft: { width: 48, alignItems: 'center' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  sectionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tripCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  validityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  validityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  bottomBar: { flexDirection: 'row', padding: 16, borderTopWidth: 1 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14,
  },
});
