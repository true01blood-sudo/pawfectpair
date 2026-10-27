/**
 * Ecran PetEdu — educație, dresaj & director traineri (instructori).
 *
 * 3 tab-uri:
 *  - Articole: bibliotecă curatoriată (DB admin-managed) cu filte specie/
 *    categorie + căutare diacritice-insensibilă (motor local din shared)
 *  - Traineri: director public de instructori — specializări, experiență,
 *    apel direct; filtre chips + căutare
 *  - Profilul meu: devino trainer — upsert profil (unul per user),
 *    activare/dezactivare vizibilitate, badge „verified" (setat de admin)
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Card, Button, StateView, Input } from '../../components/ui';
import {
  useEduArticles,
  useTrainers,
  useMyTrainerProfile,
  useSaveTrainerProfile,
  useToggleTrainerActive,
  useDeleteTrainerProfile,
} from '../../hooks/useEdu';
import {
  EDU_SPECIES,
  EDU_SPECIES_EMOJI,
  TRAINER_SPECIALTIES,
  TRAINER_SPECIALTY_EMOJI,
  filterEduArticles,
  sortEduArticles,
  eduArticleCategories,
  filterTrainers,
  sortTrainers,
  bioExcerpt,
  eduSpeciesKey,
  type EduSpecies,
  type Trainer,
  type TrainerSpecialty,
  type TrainerInput,
} from '@pawfectpair/shared';

type Tab = 'articles' | 'trainers' | 'profile';

// ============================================================
// Ecran principal
// ============================================================

export default function PetEduScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [tab, setTab] = useState<Tab>('articles');

  // --- date ---
  const { data: articles, isLoading: articlesLoading, error: articlesError } =
    useEduArticles();
  const { data: trainers, isLoading: trainersLoading, error: trainersError } =
    useTrainers();
  const { data: myTrainer } = useMyTrainerProfile();

  // --- filtre articole (locale, instant) ---
  const [articleSearch, setArticleSearch] = useState('');
  const [species, setSpecies] = useState<EduSpecies | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedArticles = useMemo(() => sortEduArticles(articles ?? []), [articles]);
  const categories = useMemo(
    () => eduArticleCategories(articles ?? []),
    [articles]
  );
  const filteredArticles = useMemo(
    () =>
      filterEduArticles(sortedArticles, {
        species,
        category,
        search: articleSearch || null,
      }),
    [sortedArticles, species, category, articleSearch]
  );

  // --- filtre traineri (locale, instant) ---
  const [trainerSearch, setTrainerSearch] = useState('');
  const [specialty, setSpecialty] = useState<TrainerSpecialty | null>(null);
  const sortedTrainers = useMemo(() => sortTrainers(trainers ?? []), [trainers]);
  const filteredTrainers = useMemo(
    () =>
      filterTrainers(sortedTrainers, {
        specialty,
        search: trainerSearch || null,
      }),
    [sortedTrainers, specialty, trainerSearch]
  );

  // --- profil trainer ---
  const [formVisible, setFormVisible] = useState(false);
  const { mutateAsync: saveProfile, isPending: saving } = useSaveTrainerProfile();
  const { mutateAsync: toggleActive, isPending: toggling } = useToggleTrainerActive();
  const { mutateAsync: deleteProfileAsync } = useDeleteTrainerProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const openForm = () => {
    setFormError(null);
    setFormVisible(true);
  };

  const onToggleActive = async () => {
    if (!myTrainer) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      await toggleActive({ active: !myTrainer.active });
    } catch {
      RNAlert.alert(t('edu.title'), t('edu.errorGeneric'));
    }
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'articles', label: t('edu.tabArticles'), icon: 'book' },
    { id: 'trainers', label: t('edu.tabTrainers'), icon: 'people' },
    { id: 'profile', label: t('edu.tabProfile'), icon: 'person' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('edu.title') }} />

      {/* Bară tab-uri */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTab(item.id);
              }}
              style={[
                styles.tabChip,
                { backgroundColor: active ? theme.colors.primary : theme.colors.surface },
              ]}
            >
              <Ionicons
                name={item.icon as 'book'}
                size={14}
                color={active ? '#fff' : theme.colors.textMuted}
              />
              <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '700' }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ============ ARTICOLE ============ */}
      {tab === 'articles' ? (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <Input
            placeholder={t('edu.searchPlaceholder')}
            value={articleSearch}
            onChangeText={setArticleSearch}
            maxLength={80}
          />

          {/* specie */}
          <View style={styles.chipWrap}>
            <Chip
              label={`${EDU_SPECIES_EMOJI.general} ${t('edu.speciesAll')}`}
              active={species === null}
              theme={theme}
              onPress={() => setSpecies(null)}
            />
            {EDU_SPECIES.map((sp) => (
              <Chip
                key={sp}
                label={`${EDU_SPECIES_EMOJI[sp]} ${t(`edu.sp_${sp}`)}`}
                active={species === sp}
                theme={theme}
                onPress={() => setSpecies(species === sp ? null : sp)}
              />
            ))}
          </View>

          {/* categorii (derivate din conținut) */}
          {categories.length > 0 ? (
            <View style={styles.chipWrap}>
              <Chip
                label={t('edu.categoryAll')}
                active={category === null}
                theme={theme}
                onPress={() => setCategory(null)}
              />
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={category === c}
                  theme={theme}
                  onPress={() => setCategory(category === c ? null : c)}
                />
              ))}
            </View>
          ) : null}

          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {t('edu.articleCount', { count: filteredArticles.length })}
          </Text>

          {articlesLoading ? (
            <StateView loading />
          ) : articlesError ? (
            <StateView error={t('edu.errorGeneric')} />
          ) : filteredArticles.length === 0 ? (
            <StateView
              emoji="📚"
              title={t('edu.articlesEmpty')}
              description={t('edu.articlesEmptyHint')}
            />
          ) : (
            filteredArticles.map((a) => (
              <ArticleCard
                key={a.id}
                title={a.title}
                body={a.body}
                species={eduSpeciesKey(a.species)}
                category={a.category}
                expanded={expandedId === a.id}
                onToggle={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setExpandedId(expandedId === a.id ? null : a.id);
                }}
              />
            ))
          )}
        </ScrollView>
      ) : null}

      {/* ============ TRAINERI ============ */}
      {tab === 'trainers' ? (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <Input
            placeholder={t('edu.trainerSearchPlaceholder')}
            value={trainerSearch}
            onChangeText={setTrainerSearch}
            maxLength={60}
          />

          <View style={styles.chipWrap}>
            {TRAINER_SPECIALTIES.map((sp) => (
              <Chip
                key={sp}
                label={`${TRAINER_SPECIALTY_EMOJI[sp]} ${t(`edu.spec_${sp}`)}`}
                active={specialty === sp}
                theme={theme}
                onPress={() => setSpecialty(specialty === sp ? null : sp)}
              />
            ))}
          </View>

          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {t('edu.trainerCount', { count: filteredTrainers.length })}
          </Text>

          {trainersLoading ? (
            <StateView loading />
          ) : trainersError ? (
            <StateView error={t('edu.errorGeneric')} />
          ) : filteredTrainers.length === 0 ? (
            <Card>
              <StateView
                emoji="🎓"
                title={t('edu.trainersEmpty')}
                description={t('edu.trainersEmptyHint')}
              />
              <Button
                title={t('edu.becomeTrainer')}
                onPress={() => {
                  setTab('profile');
                }}
                fullWidth
                style={{ marginTop: 8 }}
              />
            </Card>
          ) : (
            filteredTrainers.map((tr) => (
              <TrainerCard
                key={tr.id}
                trainer={tr}
                onCall={() => {
                  if (!tr.phone) return;
                  RNAlert.alert(
                    t('edu.callConfirmTitle'),
                    t('edu.callConfirmMsg', { name: tr.display_name, phone: tr.phone }),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('edu.callTrainer'),
                        onPress: () =>
                          Linking.openURL(`tel:${tr.phone!.replace(/\s/g, '')}`).catch(() => {}),
                      },
                    ]
                  );
                }}
              />
            ))
          )}
        </ScrollView>
      ) : null}

      {/* ============ PROFILUL MEU DE TRAINER ============ */}
      {tab === 'profile' ? (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md , maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <Card>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
              🎓 {t('edu.profileTitle')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
              {t('edu.trainerPitch')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 8 }}>
              {t('edu.verifiedByAdmin')}
            </Text>
          </Card>

          {!myTrainer ? (
            <Card>
              <StateView
                emoji="🪪"
                title={t('edu.notTrainer')}
                description={t('edu.notTrainerHint')}
              />
              <Button
                title={t('edu.becomeTrainer')}
                onPress={openForm}
                fullWidth
                style={{ marginTop: 8 }}
              />
            </Card>
          ) : (
            <>
              <Card>
                <View style={styles.profileHeader}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={{ fontSize: 26 }}>🎓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
                        {myTrainer.display_name}
                      </Text>
                      {myTrainer.verified ? (
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                      ) : null}
                    </View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                      {
                        [
                          myTrainer.city,
                          myTrainer.experience_years === 1
                            ? t('edu.yearsExpOne')
                            : t('edu.yearsExp', { count: myTrainer.experience_years }),
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      }
                    </Text>
                  </View>
                </View>

                {/* status activ */}
                <Pressable
                  onPress={onToggleActive}
                  disabled={toggling}
                  style={[styles.activeBox, {
                    backgroundColor: myTrainer.active ? theme.colors.success + '18' : theme.colors.surfaceAlt,
                    borderColor: myTrainer.active ? theme.colors.success : theme.colors.border,
                  }]}
                >
                  <Ionicons
                    name={myTrainer.active ? 'eye' : 'eye-off'}
                    size={18}
                    color={myTrainer.active ? theme.colors.success : theme.colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>
                      {myTrainer.active ? t('edu.activeLabel') : t('edu.inactiveLabel')}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                      {t('edu.toggleHint')}
                    </Text>
                  </View>
                  <View
                    style={[styles.switchDot, {
                      backgroundColor: myTrainer.active ? theme.colors.success : theme.colors.border,
                    }]}
                  />
                </Pressable>

                {/* specializări */}
                <View style={styles.chipWrap}>
                  {myTrainer.specialties.map((sp) => (
                    <Chip
                      key={sp}
                      label={`${TRAINER_SPECIALTY_EMOJI[sp]} ${t(`edu.spec_${sp}`)}`}
                      active={false}
                      theme={theme}
                      onPress={() => {}}
                    />
                  ))}
                </View>

                {myTrainer.bio ? (
                  <Text style={{ color: theme.colors.text, fontSize: 13, lineHeight: 19, marginTop: 8 }}>
                    {myTrainer.bio}
                  </Text>
                ) : null}

                <View style={styles.profileActions}>
                  <Button title={t('edu.editProfile')} size="sm" onPress={openForm} style={{ flex: 1 }} />
                </View>
              </Card>

              <Button
                title={t('edu.deleteProfile')}
                variant="ghost"
                size="sm"
                onPress={() => {
                  RNAlert.alert(
                    t('edu.deleteConfirmTitle'),
                    t('edu.deleteConfirmMsg'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('edu.deleteProfile'),
                        style: 'destructive',
                        onPress: () => {
                          deleteProfileAsync()
                            .then(() =>
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
                            )
                            .catch(() => RNAlert.alert(t('edu.title'), t('edu.errorGeneric')));
                        },
                      },
                    ]
                  );
                }}
              />
            </>
          )}
        </ScrollView>
      ) : null}

      {/* Modal formular trainer */}
      <TrainerFormModal
        visible={formVisible}
        existing={myTrainer ?? null}
        saving={saving}
        error={formError}
        onClose={() => setFormVisible(false)}
        onSave={async (input) => {
          setFormError(null);
          try {
            await saveProfile(input);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setFormVisible(false);
          } catch (e) {
            setFormError(e instanceof Error ? e.message : t('edu.errorGeneric'));
          }
        }}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Chip reutilizabil
// ============================================================

function Chip({
  label,
  active,
  theme,
  onPress,
}: {
  label: string;
  active: boolean;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, {
        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
        borderColor: active ? theme.colors.primary : theme.colors.border,
      }]}
    >
      <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================
// Card articol expandabil
// ============================================================

function ArticleCard({
  title,
  body,
  species,
  category,
  expanded,
  onToggle,
}: {
  title: string;
  body: string;
  species: EduSpecies;
  category: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  return (
    <Card>
      <Pressable onPress={onToggle}>
        <View style={styles.articleHeader}>
          <Text style={{ fontSize: 20 }}>{EDU_SPECIES_EMOJI[species]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 15, lineHeight: 20 }}>
              {title}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
              {t(`edu.sp_${species}`)}
              {category ? ` · ${category}` : ''}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textMuted}
          />
        </View>
      </Pressable>
      {expanded ? (
        <Text style={{ color: theme.colors.text, fontSize: 13, lineHeight: 20, marginTop: 10 }}>
          {body}
        </Text>
      ) : null}
    </Card>
  );
}

// ============================================================
// Card trainer
// ============================================================

function TrainerCard({ trainer, onCall }: { trainer: Trainer; onCall: () => void }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const excerpt = bioExcerpt(trainer.bio, 140);
  return (
    <Card>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={{ fontSize: 22 }}>🎓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
              {trainer.display_name}
            </Text>
            {trainer.verified ? (
              <Ionicons name="checkmark-circle" size={15} color={theme.colors.success} />
            ) : null}
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {trainer.experience_years === 1
              ? t('edu.yearsExpOne')
              : t('edu.yearsExp', { count: trainer.experience_years })}
            {trainer.city ? ` · ${trainer.city}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.chipWrap}>
        {trainer.specialties.map((sp) => (
          <Chip
            key={sp}
            label={`${TRAINER_SPECIALTY_EMOJI[sp]} ${t(`edu.spec_${sp}`)}`}
            active={false}
            theme={theme}
            onPress={() => {}}
          />
        ))}
      </View>

      {excerpt ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
          {excerpt}
        </Text>
      ) : null}

      <View style={styles.trainerFooter}>
        {trainer.price_range ? (
          <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>
            💰 {trainer.price_range}
          </Text>
        ) : (
          <View />
        )}
        {trainer.phone ? (
          <Button
            title={t('edu.callTrainer')}
            size="sm"
            onPress={onCall}
            style={{ minWidth: 120 }}
          />
        ) : null}
      </View>
    </Card>
  );
}

// ============================================================
// Modal formular trainer
// ============================================================

const FORM_PLACEHOLDER_STATE = {
  specialties: [] as TrainerSpecialty[],
};

function TrainerFormModal({
  visible,
  existing,
  saving,
  error,
  onClose,
  onSave,
}: {
  visible: boolean;
  existing: Trainer | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: TrainerInput) => void;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState<TrainerSpecialty[]>([]);
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [bio, setBio] = useState('');

  // preumplere la deschidere
  useEffect(() => {
    if (visible) {
      setName(existing?.display_name ?? '');
      setSpecialties(existing?.specialties ?? FORM_PLACEHOLDER_STATE.specialties);
      setCity(existing?.city ?? '');
      setExperience(
        existing && existing.experience_years > 0 ? String(existing.experience_years) : ''
      );
      setPhone(existing?.phone ?? '');
      setPrice(existing?.price_range ?? '');
      setBio(existing?.bio ?? '');
    }
  }, [visible, existing]);

  const toggleSpecialty = (sp: TrainerSpecialty) => {
    Haptics.selectionAsync().catch(() => {});
    setSpecialties((prev) =>
      prev.includes(sp) ? prev.filter((x) => x !== sp) : [...prev, sp]
    );
  };

  const canSave =
    name.trim().length >= 2 &&
    specialties.length > 0 &&
    (experience.trim() === '' || !Number.isNaN(Number(experience.trim())));

  const submit = () => {
    if (!canSave) return;
    onSave({
      display_name: name.trim(),
      specialties,
      city: city.trim() || null,
      bio: bio.trim() || null,
      experience_years: Math.max(0, Math.min(60, Number(experience.trim() || 0))),
      phone: phone.trim() || null,
      price_range: price.trim() || null,
    });
  };

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('edu.formTitle')}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Input
          label={t('edu.name')}
          placeholder={t('edu.namePh')}
          value={name}
          onChangeText={setName}
          maxLength={60}
        />

        <Text style={styles.formLabel}>{t('edu.specialtiesLabel')}</Text>
        <View style={styles.chipWrap}>
          {TRAINER_SPECIALTIES.map((sp) => (
            <Chip
              key={sp}
              label={`${TRAINER_SPECIALTY_EMOJI[sp]} ${t(`edu.spec_${sp}`)}`}
              active={specialties.includes(sp)}
              theme={theme}
              onPress={() => toggleSpecialty(sp)}
            />
          ))}
        </View>
        {specialties.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginBottom: 12 }}>
            {t('edu.specialtiesHint')}
          </Text>
        ) : null}

        <Input
          label={t('edu.city')}
          placeholder={t('edu.cityPh')}
          value={city}
          onChangeText={setCity}
          maxLength={60}
        />
        <Input
          label={t('edu.experience')}
          placeholder={t('edu.experiencePh')}
          value={experience}
          onChangeText={(v) => setExperience(v.replace(/[^0-9]/g, ''))}
          maxLength={2}
          keyboardType="number-pad"
        />
        <Input
          label={t('edu.phoneLabel')}
          placeholder={t('edu.phonePh')}
          value={phone}
          onChangeText={setPhone}
          maxLength={20}
          keyboardType="phone-pad"
        />
        <Input
          label={t('edu.priceLabel')}
          placeholder={t('edu.pricePh')}
          value={price}
          onChangeText={setPrice}
          maxLength={30}
        />
        <Input
          label={t('edu.bioLabel')}
          placeholder={t('edu.bioPh')}
          value={bio}
          onChangeText={setBio}
          maxLength={600}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }}
        />

        {error ? (
          <Text style={{ color: theme.colors.danger, fontSize: 12, marginBottom: 8 }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title={t('common.cancel')} variant="ghost" onPress={onClose} style={{ flex: 1 }} />
          <Button
            title={t('edu.save')}
            onPress={submit}
            disabled={!canSave}
            loading={saving}
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </ModalShell>
  );
}

// ============================================================
// Shell modal (overlay + card)
// ============================================================

function ModalShell({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  if (!visible) return null;
  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.sheetHeader}>
          <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800' }}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={theme.colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
          <View style={{ height: 16 }} />
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

// ============================================================
// Stiluri
// ============================================================

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginTop: 12,
  },
  switchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  trainerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
