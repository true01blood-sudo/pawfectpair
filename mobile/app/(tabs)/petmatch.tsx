/**
 * Ecran PetMatch — swipe la animalele din comunitate.
 * La match reciproc afișează modal de celebrare + link spre conversație.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Card, StateView } from '../../components/ui';
import { SwipeCard } from '../../components/match';
import { useMatchCandidates, useLikePet, usePassPet, useMyPets } from '../../hooks';
import { SPECIES_OPTIONS, SPECIES_LABELS, PET_SEX_OPTIONS } from '@pawfectpair/shared';
import type { Pet, Match } from '@pawfectpair/shared';

export default function PetMatchScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const [filters, setFilters] = useState<{ species?: string; sex?: string }>({});
  const candidates = useMatchCandidates(filters);
  const myPets = useMyPets();
  const like = useLikePet();
  const pass = usePassPet();
  const [matchData, setMatchData] = useState<{ match: Match; pet: Pet } | null>(null);
  const [cursor, setCursor] = useState(0);

  // Top 5 animale vizibile simultan (efect de stivă)
  const visible = useMemo(() => (candidates.data ?? []).slice(cursor, cursor + 5), [candidates.data, cursor]);
  const currentPet = visible[0];

  async function handleSwipe(direction: 'left' | 'right') {
    if (!currentPet) return;
    const myPetId = myPets.data?.[0]?.id;
    if (!myPetId) {
      Alert.alert('Adaugă un animal', 'Trebuie să ai cel puțin un animal în profil pentru a folosi PetMatch.');
      return;
    }
    try {
      if (direction === 'right') {
        const result = await like.mutateAsync({ fromPetId: myPetId, toPetId: currentPet.id });
        if (result.matched && result.match) {
          setMatchData({ match: result.match, pet: currentPet });
        }
      } else {
        await pass.mutateAsync({ fromPetId: myPetId, toPetId: currentPet.id });
      }
    } catch (e: any) {
      Alert.alert('Eroare', e?.message ?? 'Încearcă din nou');
    }
    setCursor((c) => c + 1);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['top']}>
      {/* Filtre */}
      <View style={{ padding: t.spacing.md }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeLg, fontFamily: t.typography.fontFamilyBold, marginBottom: t.spacing.sm }}>
          Găsește companioni
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <FilterChip label="Toate" active={!filters.species && !filters.sex} onPress={() => setFilters({})} />
          {SPECIES_OPTIONS.map((s) => (
            <FilterChip key={s} label={s} active={filters.species === s} onPress={() => setFilters((f) => ({ ...f, species: f.species === s ? undefined : s }))} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {PET_SEX_OPTIONS.map((s) => (
            <FilterChip key={s} label={SPECIES_LABELS[s]} active={filters.sex === s} onPress={() => setFilters((f) => ({ ...f, sex: f.sex === s ? undefined : s }))} />
          ))}
        </View>
      </View>

      {/* Stiva de carduri */}
      <View style={{ flex: 1, paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.lg }}>
        <StateView
          loading={candidates.isLoading}
          error={candidates.error?.message}
          empty={!candidates.isLoading && !currentPet}
          emptyText="Nu mai sunt animale disponibile cu aceste filtre. Schimbă filtrele sau revino mai târziu!"
        >
          <View style={styles.stack}>
            {[...visible].reverse().map((pet, i) => {
              const realIndex = visible.length - 1 - i;
              return (
                <SwipeCard
                  key={pet.id}
                  pet={pet}
                  index={realIndex}
                  onSwipe={handleSwipe}
                />
              );
            })}
          </View>
        </StateView>
      </View>

      {/* Butoane acțiune rapidă */}
      {currentPet && (
        <View style={[styles.actionRow, { paddingBottom: t.spacing.lg }]}>
          <Button title="✕ Skip" variant="outline" size="lg" onPress={() => handleSwipe('left')} loading={pass.isPending} style={{ flex: 1 }} />
          <Button title="❤ Inimă" size="lg" onPress={() => handleSwipe('right')} loading={like.isPending} style={{ flex: 1 }} />
        </View>
      )}

      {/* Modal match */}
      <Modal visible={!!matchData} transparent animationType="fade" onRequestClose={() => setMatchData(null)}>
        <View style={styles.modalOverlay}>
          <Card elevated="lg" style={{ margin: 24, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 64 }}>🎉</Text>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeXl, fontFamily: t.typography.fontFamilyBold, textAlign: 'center' }}>
              Ai un match!
            </Text>
            <Text style={{ color: t.colors.textMuted, textAlign: 'center' }}>
              Companionul {matchData?.pet.name} a acceptat să vă cunoașteți. Trimite-i un mesaj!
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Button title="Închide" variant="ghost" onPress={() => setMatchData(null)} />
              <Button title="Deschide conversația" onPress={() => {
                const m = matchData;
                setMatchData(null);
                if (m) router.push({ pathname: '/animale/chat', params: { matchId: m.match.id, petId: m.match.pet_a_id } });
              }} />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useAppTheme();
  return (
    <Button
      title={label}
      variant={active ? 'primary' : 'outline'}
      size="sm"
      onPress={onPress}
      style={{ paddingHorizontal: 12 }}
    />
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1, position: 'relative' },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
});
