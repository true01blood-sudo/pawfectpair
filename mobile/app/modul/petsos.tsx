/**
 * Ecran PetSOS — urgențe, contact rapid, prim ajutor.
 *
 * Funcționalități MVP:
 * - Buton SOS MARE: confirmare → tip urgență (medical/pierdut/pericol)
 *   + note → înregistrare în istoric (sos_events, RLS) cu haptic puternic
 * - Pas următor ghidat per tip (cea mai importantă acțiune imediată)
 * - Contact de urgență per animal (nume + telefon) cu apel direct (tel:)
 * - Veterinare în apropiere (sortate pe distanță, apel direct)
 * - Ghiduri rapide de prim ajutor (sângerare, intoxicare, lovituri de
 *   căldură, convulsii, sufocare) — conținut static offline
 * - Istoric evenimente SOS
 *
 * Securitate: validare Zod (SosEventSchema, EmergencyContactSchema),
 * sanitizare note în queries, RLS owner-only pe evenimente.
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Linking,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView, Input } from '../../components/ui';
import { useMyPets } from '../../hooks/usePets';
import { useSosEvents, useCreateSosEvent, useSaveEmergencyContact } from '../../hooks/usePetsos';
import { useLocation, sortByDistance, DEMO_PET_PLACES, calcDistanceKm } from '../../lib/location';
import {
  SOS_TYPES,
  SOS_TYPE_EMOJI,
  FIRST_AID_GUIDES,
  SosEventSchema,
  EmergencyContactSchema,
  type SosEventType,
  type SosEvent,
} from '@pawfectpair/shared';

// ============================================================
// Ecran
// ============================================================

export default function PetSosScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();

  // --- animal ---
  const { data: pets, isLoading: petsLoading } = useMyPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const petId = selectedPetId ?? pets?.[0]?.id ?? undefined;
  const pet = pets?.find((p) => p.id === petId);

  // --- SOS ---
  const { data: events, refetch } = useSosEvents(15);
  const createEvent = useCreateSosEvent();
  const saveContact = useSaveEmergencyContact();

  // --- modale ---
  const [showSos, setShowSos] = useState(false);
  const [sosType, setSosType] = useState<SosEventType>('medical');
  const [sosNotes, setSosNotes] = useState('');
  const [sosError, setSosError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<SosEvent | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  // --- locație pentru veterinare apropiate ---
  const { coords } = useLocation();
  const vets = useMemo(() => {
    const vetPlaces = DEMO_PET_PLACES.filter((p) => p.type === 'vet');
    const from = coords
      ? { latitude: coords.latitude, longitude: coords.longitude }
      : { latitude: 44.4268, longitude: 26.1025 }; // fallback București
    return sortByDistance(vetPlaces, from).slice(0, 3);
  }, [coords]);

  // prefills contact din animalul selectat
  useEffect(() => {
    if (pet) {
      setContactName(pet.emergency_contact_name ?? '');
      setContactPhone(pet.emergency_contact_phone ?? '');
    }
  }, [pet?.id]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    [i18n.language]
  );

  // ================= ACȚIUNI =================

  const openSos = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setSosType('medical');
    setSosNotes('');
    setSosError(null);
    setShowSos(true);
  };

  const onSubmitSos = async () => {
    if (!petId) return;
    setSosError(null);
    const parsed = SosEventSchema.safeParse({
      pet_id: petId,
      type: sosType,
      notes: sosNotes.trim() || undefined,
    });
    if (!parsed.success) {
      setSosError(parsed.error.issues[0]?.message ?? t('petsos.errorGeneric'));
      return;
    }
    try {
      const created = await createEvent.mutateAsync(parsed.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setShowSos(false);
      setJustCreated(created);
      refetch();
    } catch (e) {
      setSosError(e instanceof Error ? e.message : t('petsos.errorGeneric'));
    }
  };

  const onSaveContact = async () => {
    if (!petId) return;
    setContactError(null);
    const parsed = EmergencyContactSchema.safeParse({
      emergency_contact_name: contactName.trim() || undefined,
      emergency_contact_phone: contactPhone.trim() || undefined,
    });
    if (!parsed.success) {
      setContactError(parsed.error.issues[0]?.message ?? t('petsos.errorContact'));
      return;
    }
    try {
      await saveContact.mutateAsync({
        petId,
        name: parsed.data.emergency_contact_name,
        phone: parsed.data.emergency_contact_phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowContact(false);
    } catch (e) {
      setContactError(e instanceof Error ? e.message : t('petsos.errorContact'));
    }
  };

  const call = (phone: string) => {
    RNAlert.alert(
      t('petsos.callTitle'),
      `${t('petsos.callNumber')} ${phone}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('petsos.callNow'), onPress: () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`) },
      ]
    );
  };

  // ================= STĂRI SIMPLE =================

  if (petsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('petsos.title') }} />
        <StateView loading />
      </SafeAreaView>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Screen options={{ title: t('petsos.title') }} />
        <StateView emoji="🐾" title={t('petsos.noPets')} description={t('petsos.noPetsHint')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('petsos.title') }} />

      {/* Selector animal */}
      <View style={[styles.petRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {t('petsos.pickPet')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {pets.map((p) => {
            const active = p.id === petId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPetId(p.id)}
                style={[styles.petChip, { backgroundColor: active ? theme.colors.danger : theme.colors.surface, borderColor: active ? theme.colors.danger : theme.colors.border }]}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* ============ BUTON SOS MARE ============ */}
        <Pressable
          onPress={openSos}
          style={({ pressed }) => [styles.sosButton, { opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
        >
          <Text style={styles.sosEmoji}>🆘</Text>
          <Text style={styles.sosText}>{t('petsos.sosButton')}</Text>
          <Text style={styles.sosSub}>{t('petsos.sosSub')}</Text>
        </Pressable>

        {/* ============ CONTACT URGENȚĂ ============ */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }}>
              📞 {t('petsos.contactSection')}
            </Text>
            <Pressable onPress={() => setShowContact(true)} hitSlop={8}>
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>
          {pet?.emergency_contact_name && pet?.emergency_contact_phone ? (
            <View style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>
                  {pet.emergency_contact_name}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{pet.emergency_contact_phone}</Text>
              </View>
              <Button title={t('petsos.callNow')} size="sm" variant="danger" onPress={() => call(pet.emergency_contact_phone!)} />
            </View>
          ) : (
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              {t('petsos.noContact')}
            </Text>
          )}
        </Card>

        {/* ============ VETERINARE APROPIATE ============ */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
            🏥 {t('petsos.vetsSection')}
          </Text>
          {vets.map((v) => {
            const dist = coords ? calcDistanceKm({ latitude: coords.latitude, longitude: coords.longitude }, v.coords) : null;
            return (
              <Card key={v.id}>
                <View style={styles.contactRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                      {v.name}
                      {v.isOpen ? ' 🟢' : ' 🔴'}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                      {v.address}
                      {dist != null ? ` · ${dist.toFixed(1)} km` : ''}
                      {v.rating ? ` · ⭐ ${v.rating}` : ''}
                    </Text>
                  </View>
                  {v.phone ? (
                    <Pressable onPress={() => call(v.phone!)} style={[styles.callBtn, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="call" size={18} color={theme.colors.primaryDark} />
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>

        {/* ============ PRIM AJUTOR ============ */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
            🧭 {t('petsos.firstAidSection')}
          </Text>
          {FIRST_AID_GUIDES.map((g) => {
            const open = openGuide === g.id;
            return (
              <Card key={g.id} padded={false}>
                <Pressable onPress={() => setOpenGuide(open ? null : g.id)} style={styles.guideHeader}>
                  <Text style={{ fontSize: 16 }}>{g.emoji}</Text>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14, flex: 1 }}>
                    {t(`petsos.guide_${g.id}`)}
                  </Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textMuted} />
                </Pressable>
                {open ? (
                  <View style={[styles.guideBody, { borderTopColor: theme.colors.border }]}>
                    {(['s1', 's2', 's3'] as const).map((step) => (
                      <Text key={step} style={{ color: theme.colors.text, fontSize: 13, lineHeight: 19 }}>
                        {t(`petsos.${g.id}_${step}`)}
                      </Text>
                    ))}
                    <Text style={{ color: theme.colors.danger, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                      {t('petsos.guideWarning')}
                    </Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>

        {/* ============ ISTORIC ============ */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>
            📜 {t('petsos.historySection')}
          </Text>
          {!events || events.length === 0 ? (
            <Card>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{t('petsos.noEvents')}</Text>
            </Card>
          ) : (
            events.map((e) => {
              const petName = pets.find((p) => p.id === e.pet_id)?.name ?? '—';
              return (
                <Card key={e.id}>
                  <View style={styles.eventRow}>
                    <Text style={{ fontSize: 16 }}>{SOS_TYPE_EMOJI[e.type]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                        {t(`petsos.type_${e.type}`)} · {petName}
                      </Text>
                      {e.notes ? (
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={2}>
                          {e.notes}
                        </Text>
                      ) : null}
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                        {dateFmt.format(new Date(e.created_at))}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ============ MODAL SOS ============ */}
      <Modal visible={showSos} animationType="fade" transparent onRequestClose={() => setShowSos(false)}>
        <View style={styles.sosBackdrop}>
          <View style={[styles.sosSheet, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <Text style={{ color: theme.colors.danger, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
                🆘 {t('petsos.sosFormTitle', { name: pet?.name ?? '' })}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                {t('petsos.sosFormIntro')}
              </Text>

              {SOS_TYPES.map((type) => {
                const active = type === sosType;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSosType(type)}
                    style={[styles.sosTypeRow, { borderColor: active ? theme.colors.danger : theme.colors.border, backgroundColor: active ? '#FEE2E2' : theme.colors.surfaceAlt }]}
                  >
                    <Text style={{ fontSize: 20 }}>{SOS_TYPE_EMOJI[type]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14 }}>
                        {t(`petsos.type_${type}`)}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                        {t(`petsos.type_${type}_hint`)}
                      </Text>
                    </View>
                    {active ? <Ionicons name="radio-button-on" size={20} color={theme.colors.danger} /> : <Ionicons name="radio-button-off" size={20} color={theme.colors.textMuted} />}
                  </Pressable>
                );
              })}

              <Input
                label={t('petsos.notesLabel')}
                placeholder={t('petsos.notesPlaceholder')}
                value={sosNotes}
                onChangeText={setSosNotes}
                maxLength={500}
                multiline
                numberOfLines={3}
              />
              {sosError ? (
                <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>{sosError}</Text>
              ) : null}
              <Button
                title={t('petsos.sosConfirm')}
                variant="danger"
                size="lg"
                fullWidth
                loading={createEvent.isPending}
                onPress={onSubmitSos}
              />
              <Button title={t('common.cancel')} variant="ghost" size="sm" onPress={() => setShowSos(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL „CE FAC ACUM" după înregistrare ============ */}
      <Modal visible={!!justCreated} animationType="slide" transparent onRequestClose={() => setJustCreated(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, styles.smallSheet, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
                {justCreated ? `${SOS_TYPE_EMOJI[justCreated.type]} ${t('petsos.recordedTitle')}` : ''}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                {t('petsos.recordedIntro')}
              </Text>
              {justCreated ? (
                (['1', '2', '3'] as const).map((step) => (
                  <Card key={step}>
                    <Text style={{ color: theme.colors.text, fontSize: 13, lineHeight: 19 }}>
                      {step}. {t(`petsos.next_${justCreated.type}_${step}`)}
                    </Text>
                  </Card>
                ))
              ) : null}
              <Button
                title={t('petsos.callVetNow')}
                variant="danger"
                size="lg"
                fullWidth
                onPress={() => {
                  const first = vets.find((v) => v.phone);
                  if (first?.phone) call(first.phone);
                }}
              />
              <Button title={t('petsos.close')} variant="ghost" size="sm" onPress={() => setJustCreated(null)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL CONTACT ============ */}
      <Modal visible={showContact} animationType="slide" transparent onRequestClose={() => setShowContact(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, styles.smallSheet, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <View style={styles.sheetHeader}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>
                  {t('petsos.contactFormTitle')}
                </Text>
                <Pressable onPress={() => setShowContact(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                </Pressable>
              </View>
              <Input label={t('petsos.contactNameLabel')} value={contactName} onChangeText={setContactName} placeholder={t('petsos.contactNamePlaceholder')} maxLength={60} />
              <Input label={t('petsos.contactPhoneLabel')} value={contactPhone} onChangeText={setContactPhone} placeholder="+40 7xx xxx xxx" keyboardType="phone-pad" maxLength={20} />
              {contactError ? (
                <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>{contactError}</Text>
              ) : null}
              <Button title={t('petsos.contactSave')} onPress={onSaveContact} loading={saveContact.isPending} fullWidth size="lg" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// Stiluri
// ============================================================

const styles = StyleSheet.create({
  petRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  petChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 160,
  },
  sosButton: {
    borderRadius: 24,
    backgroundColor: '#DC2626',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#DC2626',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  sosEmoji: {
    fontSize: 44,
  },
  sosText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 6,
  },
  sosSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  guideBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sosSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  sosTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  smallSheet: {
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
