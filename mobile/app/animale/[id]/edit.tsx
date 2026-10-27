/**
 * Editare profil animal — reutilizează PetForm.
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../../../components/theme-provider';
import { PetForm } from '../../../components/pet';
import { usePet, useUpdatePet } from '../../../hooks';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useAppTheme();
  const pet = usePet(id);
  const update = useUpdatePet();

  if (pet.isLoading) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={['bottom']}>
      <PetForm
        initial={pet.data ?? undefined}
        submitLabel="Salvează modificările"
        onSubmit={async (input) => {
          await update.mutateAsync({ id, patch: input });
        }}
      />
    </SafeAreaView>
  );
}
