/**
 * Ecran Acasă (Dashboard) — liste animale proprii, scadențe medicale apropiate,
 * buton adăugare animal, acces rapid la PetMatch.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { PetCard } from '../../components/pet';
import { MedicalRecordItem } from '../../components/medical';
import { useMyPets, useUpcomingRecords } from '../../hooks';
import { useProfile } from '../../hooks/useProfile';

export default function HomeScreen() {
  const t = useTranslation().t;
  const theme = useAppTheme();
  const router = useRouter();
  const pets = useMyPets();
  const upcoming = useUpcomingRecords();
  const profile = useProfile();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([pets.refetch(), upcoming.refetch(), profile.refetch()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl , maxWidth: 720, width: '100%', alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        {/* Header greeting */}
        <View style={styles.header}>
          <View>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>{t('home.greeting')},</Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXl, fontFamily: theme.typography.fontFamilyBold }}>
              {profile.data?.full_name ?? 'Proprietar'}!
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profil')} hitSlop={8}>
            <Logo size={40} showText={false} variant={theme.mode === 'dark' ? 'white' : 'color'} />
          </Pressable>
        </View>

        {/* Card PetMatch promo */}
        <Pressable onPress={() => router.push('/(tabs)/petmatch')} style={{ marginTop: theme.spacing.md }}>
          <Card elevated="md" style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.primary }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textInverse, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>{t('home.findCompanions')} 🐕</Text>
              <Text style={{ color: theme.colors.textInverse, fontSize: theme.typography.fontSizeSm, opacity: 0.9 }}>{t('home.findCompanionsDesc')}</Text>
            </View>
            <Text style={{ fontSize: 40 }}>❤️</Text>
          </Card>
        </Pressable>

        {/* Quick actions: Hartă + Module */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Pressable onPress={() => router.push('/(tabs)/harta')} style={{ flex: 1 }}>
            <Card style={{ alignItems: 'center', padding: theme.spacing.md }}>
              <Text style={{ fontSize: 32 }}>🗺️</Text>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontWeight: '600', marginTop: 4 }}>{t('nav.map')}</Text>
            </Card>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/module')} style={{ flex: 1 }}>
            <Card style={{ alignItems: 'center', padding: theme.spacing.md }}>
              <Text style={{ fontSize: 32 }}>📦</Text>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontWeight: '600', marginTop: 4 }}>{t('home.modules')}</Text>
            </Card>
          </Pressable>
        </View>

        {/* Animalele mele */}
        <View style={styles.sectionHeader}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
            {t('home.myPets')}
          </Text>
          <Button title={t('home.addPet')} size="sm" variant="ghost" onPress={() => router.push('/animale/nou')} />
        </View>

        <StateView
          loading={pets.isLoading}
          error={pets.error?.message}
          empty={pets.data?.length === 0}
          emptyText={t('home.noPetsDesc')}
        >
          <View style={styles.petsGrid}>
            {pets.data?.map((pet) => (
              <View key={pet.id} style={{ flex: 1, maxWidth: '50%' }}>
                <PetCard pet={pet} onPress={(p) => router.push(`/animale/${p.id}`)} />
              </View>
            ))}
          </View>
        </StateView>

        {/* Scadențe apropiate */}
        <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
            {t('home.upcomingMedical')}
          </Text>
        </View>
        <StateView
          loading={upcoming.isLoading}
          error={upcoming.error?.message}
          empty={upcoming.data?.length === 0}
          emptyText={t('home.noUpcoming')}
        >
          {upcoming.data?.map((r) => <MedicalRecordItem key={r.id} record={r} />)}
        </StateView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  petsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
