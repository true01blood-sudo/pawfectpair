/**
 * Ecran Adaugă animal nou.
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAppTheme } from '../../components/theme-provider';
import { PetForm } from '../../components/pet';
import { useCreatePet } from '../../hooks';

export default function NouAnimalScreen() {
  const t = useAppTheme();
  const create = useCreatePet();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Adaugă animal' }} />
      <PetForm
        submitLabel="Adaugă animal"
        onSubmit={async (input) => {
          await create.mutateAsync(input);
        }}
      />
    </SafeAreaView>
  );
}
