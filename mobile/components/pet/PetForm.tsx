/**
 * Formular pentru adăugare/editare animal.
 * Validare inline cu schema Zod partajată.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme-provider';
import { Button, Input, Card } from '../ui';
import {
  SPECIES_OPTIONS,
  PET_SEX_OPTIONS,
  SPECIES_LABELS,
  MAX_PHOTO_SIZE_MB,
  PEDIGREE_REGISTRIES,
  PetSchema,
  type PetForm,
  type Pet,
  type PetInput,
  detectOug50Category,
  oug50ChecklistActions,
  oug50Compliance,
  OUG50_ACTION_COLUMN,
  type Oug50ActionId,
} from '@pawfectpair/shared';
import { toDateInput } from '@pawfectpair/shared';
import { pickFromGallery, takePhoto, PhotoValidationError } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';

interface PetFormProps {
  initial?: Pet;
  onSubmit: (input: PetInput) => Promise<void>;
  submitLabel?: string;
}

export function PetForm({ initial, onSubmit, submitLabel = 'Salvează' }: PetFormProps) {
  const t = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t: tr } = useTranslation();

  const [form, setForm] = useState<PetForm>({
    name: initial?.name ?? '',
    species: initial?.species ?? 'Câine',
    sex: initial?.sex ?? 'unknown',
    breed: initial?.breed ?? '',
    birth_date: initial?.birth_date ?? '',
    photo_url: initial?.photo_url ?? null,
    notes: initial?.notes ?? '',
    pedigree_registered: initial?.pedigree_registered ?? false,
    pedigree_registry: initial?.pedigree_registry ?? '',
    pedigree_number: initial?.pedigree_number ?? '',
    dangerous_breed: initial?.dangerous_breed ?? false,
    oug50_category: (initial?.oug50_category ?? 0) as PetForm['oug50_category'],
    oug50_owner_18: initial?.oug50_owner_18 ?? false,
    oug50_registration: initial?.oug50_registration ?? false,
    oug50_microchip: initial?.oug50_microchip ?? false,
    oug50_insurance: initial?.oug50_insurance ?? false,
    oug50_sign: initial?.oug50_sign ?? false,
    oug50_sterilized: initial?.oug50_sterilized ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof PetForm>(key: K, value: PetForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhoto(mode: 'gallery' | 'camera') {
    try {
      setUploading(true);
      const picked = mode === 'gallery' ? await pickFromGallery() : await takePhoto();
      if (!picked) return;
      if (!user) throw new Error('Nu ești autentificat');
      const publicUrl = await uploadPetPhoto(picked.uri, user.id, picked.ext);
      set('photo_url', publicUrl);
    } catch (e) {
      const msg = e instanceof PhotoValidationError ? e.message : 'Eroare la încărcarea pozei';
      Alert.alert('Imagine', msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setErrors({});
    const parsed = PetSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) map[String(issue.path[0])] = issue.message;
      }
      setErrors(map);
      return;
    }
    setBusy(true);
    try {
      const ougActive = parsed.data.species === 'Câine' && form.dangerous_breed === true;
      const detectedCat = detectOug50Category(parsed.data.breed);
      await onSubmit({
        name: parsed.data.name,
        species: parsed.data.species,
        sex: parsed.data.sex,
        breed: parsed.data.breed ?? null,
        birth_date: parsed.data.birth_date ?? null,
        photo_url: parsed.data.photo_url ?? null,
        notes: parsed.data.notes ?? null,
        // Pedigree — doar câini & pisici
        pedigree_registered:
          parsed.data.species === 'Câine' || parsed.data.species === 'Pisică'
            ? form.pedigree_registered === true
            : false,
        pedigree_registry:
          form.pedigree_registry && form.pedigree_registry.trim()
            ? form.pedigree_registry.trim()
            : null,
        pedigree_number:
          form.pedigree_number && form.pedigree_number.trim()
            ? form.pedigree_number.trim()
            : null,
        // Cadrul legal OUG 55/2002 — doar câini
        dangerous_breed: ougActive,
        oug50_category: ougActive ? (detectedCat > 0 ? detectedCat : form.oug50_category || 2) : 0,
        oug50_owner_18: ougActive ? form.oug50_owner_18 === true : false,
        oug50_registration: ougActive ? form.oug50_registration === true : false,
        oug50_microchip: ougActive ? form.oug50_microchip === true : false,
        oug50_insurance: ougActive ? form.oug50_insurance === true : false,
        oug50_sign: ougActive ? form.oug50_sign === true : false,
        oug50_sterilized: ougActive ? form.oug50_sterilized === true : false,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Eroare', e?.message ?? 'Nu am putut salva');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
      <Card>
        <View style={{ alignItems: 'center', paddingVertical: t.spacing.md }}>
          {form.photo_url ? (
            <Image source={{ uri: form.photo_url }} style={{ width: 140, height: 140, borderRadius: 70 }} contentFit="cover" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: t.colors.surfaceAlt, width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 56 }}>🐾</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm, justifyContent: 'center', marginTop: t.spacing.sm }}>
          <Button title="Galerie" variant="outline" size="sm" onPress={() => handlePhoto('gallery')} loading={uploading} />
          <Button title="Cameră" variant="outline" size="sm" onPress={() => handlePhoto('camera')} loading={uploading} />
        </View>
        <Text style={{ textAlign: 'center', color: t.colors.textMuted, fontSize: t.typography.fontSizeXs, marginTop: t.spacing.xs }}>
          Max {MAX_PHOTO_SIZE_MB}MB · JPEG / PNG / WebP / HEIC
        </Text>
      </Card>

      <Input
        label="Nume *"
        value={form.name}
        onChangeText={(v) => set('name', v)}
        error={errors.name}
        placeholder="Rex"
      />

      <View>
        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm, fontFamily: t.typography.fontFamilyMedium, marginBottom: t.spacing.xs }}>Specie *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
          {SPECIES_OPTIONS.map((s) => {
            const active = form.species === s;
            return (
              <Button
                key={s}
                title={s}
                variant={active ? 'primary' : 'outline'}
                size="sm"
                onPress={() => set('species', s)}
              />
            );
          })}
        </View>
        {errors.species && <Text style={{ color: t.colors.danger, fontSize: t.typography.fontSizeXs, marginTop: t.spacing.xs }}>{errors.species}</Text>}
      </View>

      <View>
        <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm, fontFamily: t.typography.fontFamilyMedium, marginBottom: t.spacing.xs }}>Sex *</Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {PET_SEX_OPTIONS.map((s) => (
            <Button
              key={s}
              title={SPECIES_LABELS[s]}
              variant={form.sex === s ? 'primary' : 'outline'}
              size="sm"
              onPress={() => set('sex', s)}
            />
          ))}
        </View>
        {errors.sex && <Text style={{ color: t.colors.danger, fontSize: t.typography.fontSizeXs, marginTop: t.spacing.xs }}>{errors.sex}</Text>}
      </View>

      <Input
        label="Rasă"
        value={form.breed ?? ''}
        onChangeText={(v) => set('breed', v)}
        error={errors.breed}
        placeholder="Labrador"
      />

      {/* ——— Pedigree (câini & pisici) ——— */}
      {(form.species === 'Câine' || form.species === 'Pisică') && (
        <Card>
          <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeMd, fontFamily: t.typography.fontFamilyBold, marginBottom: t.spacing.sm }}>
            📜 {tr('petext.pedigree_section')}
          </Text>
          <View style={styles.switchRow}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.fontSizeSm, flex: 1 }}>
              {tr('petext.pedigree_toggle')}
            </Text>
            <Switch
              value={form.pedigree_registered === true}
              onValueChange={(v) => set('pedigree_registered', v)}
              trackColor={{ false: t.colors.border, true: t.colors.primary }}
              thumbColor={t.colors.surface}
            />
          </View>
          {form.pedigree_registered === true && (
            <View style={{ gap: t.spacing.xs, marginTop: t.spacing.sm }}>
              <Input
                label={tr('petext.pedigree_registry')}
                value={form.pedigree_registry ?? ''}
                onChangeText={(v) => set('pedigree_registry', v)}
                placeholder="LRC"
                maxLength={60}
              />
              <View style={styles.registryChips}>
                {PEDIGREE_REGISTRIES.map((r) => (
                  <Button
                    key={r}
                    title={r}
                    size="sm"
                    variant={form.pedigree_registry === r ? 'primary' : 'outline'}
                    onPress={() => set('pedigree_registry', form.pedigree_registry === r ? '' : r)}
                  />
                ))}
              </View>
              <Input
                label={tr('petext.pedigree_number')}
                value={form.pedigree_number ?? ''}
                onChangeText={(v) => set('pedigree_number', v)}
                placeholder={tr('petext.pedigree_number_ph')}
                maxLength={60}
              />
            </View>
          )}
        </Card>
      )}

      {/* ——— Cadrul legal OUG 55/2002 (doar câini) ——— */}
      {form.species === 'Câine' && (
        <Oug50Section form={form} set={set} tr={tr} />
      )}

      <Input
        label="Dată naștere (YYYY-MM-DD)"
        value={form.birth_date ?? ''}
        onChangeText={(v) => set('birth_date', v)}
        error={errors.birth_date}
        placeholder={toDateInput()}
        helper="Lăsați gol dacă nu știți"
      />

      <Input
        label="Note"
        value={form.notes ?? ''}
        onChangeText={(v) => set('notes', v)}
        error={errors.notes}
        placeholder="Preferințe, alergii, caracter..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <Button title={submitLabel} onPress={handleSubmit} loading={busy} fullWidth size="lg" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  placeholder: { borderRadius: 70 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  registryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  ougBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  ougReqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    flex: 1,
  },
});

// ============================================================
// Sub-componentă: cadrul legal OUG 55/2002 (doar câini)
// ============================================================

const OUG_ACTION_LABEL_KEY: Record<Oug50ActionId, string> = {
  owner_18: 'petext.oug50_req_owner_18',
  registration: 'petext.oug50_req_registration',
  microchip: 'petext.oug50_req_microchip',
  insurance: 'petext.oug50_req_insurance',
  sign: 'petext.oug50_req_sign',
  sterilized: 'petext.oug50_req_sterilized',
};

function Oug50Section({
  form,
  set,
  tr,
}: {
  form: PetForm;
  set: <K extends keyof PetForm>(key: K, value: PetForm[K]) => void;
  tr: (k: string, o?: Record<string, unknown>) => string;
}) {
  const theme = useAppTheme();
  const detected = useMemo(() => detectOug50Category(form.breed), [form.breed]);
  const active = detected > 0 || form.dangerous_breed === true;
  const category: 1 | 2 = detected === 1 ? 1 : detected === 2 ? 2 : form.oug50_category === 1 ? 1 : 2;
  const actions = useMemo(() => oug50ChecklistActions(category), [category]);
  const compliance = useMemo(
    () =>
      oug50Compliance(
        {
          oug50_owner_18: form.oug50_owner_18,
          oug50_registration: form.oug50_registration,
          oug50_microchip: form.oug50_microchip,
          oug50_insurance: form.oug50_insurance,
          oug50_sign: form.oug50_sign,
          oug50_sterilized: form.oug50_sterilized,
        },
        category
      ),
    [form.oug50_owner_18, form.oug50_registration, form.oug50_microchip, form.oug50_insurance, form.oug50_sign, form.oug50_sterilized, category]
  );

  if (!active) {
    return (
      <Card>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.xs }}>
          ⚖️ {tr('petext.oug50_section')}
        </Text>
        <View style={styles.switchRow}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, flex: 1 }}>
            {tr('petext.oug50_toggle')}
          </Text>
          <Switch
            value={false}
            onValueChange={(v) => {
              set('dangerous_breed', v);
              if (v && (form.oug50_category ?? 0) === 0) set('oug50_category', 2);
            }}
            trackColor={{ false: theme.colors.border, true: theme.colors.warning }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </Card>
    );
  }

  const pct = compliance.total > 0 ? Math.round((compliance.done / compliance.total) * 100) : 0;

  return (
    <Card>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold, marginBottom: theme.spacing.xs }}>
        ⚖️ {tr('petext.oug50_section')}
      </Text>

      <View style={[styles.ougBanner, { backgroundColor: theme.colors.warning + '18', borderColor: theme.colors.warning }]}>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
          {tr('petext.oug50_banner')}
        </Text>
        <Text style={{ color: theme.colors.warning, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
          {detected > 0 ? `${tr('petext.oug50_detected')}: ` : ''}
          {category === 1 ? tr('petext.oug50_cat1') : tr('petext.oug50_cat2')}
        </Text>
      </View>

      {/* Progres conformitate */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: theme.spacing.md }}>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: compliance.complete ? theme.colors.success : theme.colors.warning }} />
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
          {compliance.complete
            ? `✅ ${tr('petext.oug50_complete_ok')}`
            : tr('petext.oug50_progress', { done: compliance.done, total: compliance.total })}
        </Text>
      </View>

      {/* Checklist bifabil */}
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium, marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
        {tr('petext.oug50_checklist')}
      </Text>
      {actions.map((id) => {
        const col = OUG50_ACTION_COLUMN[id];
        const val = (form[col] as boolean | null | undefined) === true;
        return (
          <View key={id} style={styles.switchRow}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, flex: 1 }}>
              {tr(OUG_ACTION_LABEL_KEY[id])}
            </Text>
            <Switch
              value={val}
              onValueChange={(v) => set(col, v)}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor={theme.colors.surface}
            />
          </View>
        );
      })}

      {/* Cerințe permanente (info) */}
      <View style={[styles.ougBanner, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, marginTop: theme.spacing.sm }]}>
        <View style={styles.ougReqRow}>
          <Text style={{ fontSize: 14 }}>🚨</Text>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXs, flex: 1 }}>
            {tr('petext.oug50_req_muzzle_leash')} — {tr('petext.oug50_required_by_law')}
          </Text>
        </View>
        {category === 1 && (
          <View style={styles.ougReqRow}>
            <Text style={{ fontSize: 14 }}>🚫</Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXs, flex: 1 }}>
              {tr('petext.oug50_req_no_public_venues')}
            </Text>
          </View>
        )}
      </View>

      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs, marginTop: theme.spacing.sm }}>
        ℹ️ {tr('petext.oug50_legal_note')}
      </Text>
    </Card>
  );
}
