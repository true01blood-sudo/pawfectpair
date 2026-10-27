/**
 * Funcții reutilizabile pentru acces la baza de date Supabase.
 * Toate returnează date gata formatate; erorile sunt propagate către hooks.
 *
 * SECURITATE: toate valorile text sunt sanitizate ÎNAINTE de insert/update.
 * RLS garantează la nivel de DB că utilizatorul accesează doar propriile date.
 */
import { supabase } from './client';
import type {
  Profile,
  Pet,
  PetInput,
  MedicalRecord,
  MedicalRecordInput,
  WeightLog,
  WeightLogInput,
  Match,
  Message,
  Conversation,
  GuardianZone,
  GuardianZoneInput,
  GuardianPing,
  GuardianPingInput,
  GuardianAlert,
  GuardianAlertType,
  PlannerTask,
  PlannerTaskInput,
  AdoptionListing,
  AdoptionListingInput,
  AdoptionApplication,
  AdoptionFilters,
  AdoptionStatus,
  ApplicationStatus,
  SosEvent,
  SosEventType,
  EduArticle,
  EduFilters,
  Trainer,
  TrainerInput,
  TrainerFilters,
  TrainerSpecialty,
  PetDayListing,
  PetDayListingWithOwner,
  PetDayListingInput,
  PetDayBooking,
  PetDayBookingWithRefs,
  PetDayBookingInput,
  PetDayBookingStatus,
  PetDayFilters,
  PetEvent,
  PetEventWithRefs,
  PetEventFilters,
  PetEventInput,
  EventParticipant,
  EventParticipantWithProfile,
  EventRsvpInput,
  EventRsvpStatus,
  EventStatus,
  MarketProduct,
  MarketProductWithSeller,
  MarketProductInput,
  MarketFilters,
  MarketOrder,
  MarketOrderWithItems,
  MarketOrderItem,
  MarketOrderInput,
  MarketOrderStatus,
  MarketProductStatus,
  ForumPost,
  ForumPostWithRefs,
  ForumComment,
  ForumCommentWithAuthor,
  ForumPostInput,
  ForumCommentInput,
  ConnectFilters,
  TrainingSkill,
  TrainingSkillInput,
  TrainingSkillStatus,
  TrainingSession,
  TrainingSessionInput,
  TrainingFilters,
  ResqCase,
  ResqCaseWithReporter,
  ResqCaseInput,
  ResqFilters,
  ResqStatus,
  ResqTip,
  ResqTipWithAuthor,
  InsurancePolicy,
  InsurancePolicyWithPet,
  InsurancePolicyInput,
  InsuranceFilters,
  PolicyStatus,
  InsuranceClaim,
  InsuranceClaimWithPolicy,
  InsuranceClaimInput,
  ClaimStatus,
  LegacyPlan,
  LegacyPlanWithPet,
  LegacyPlanInput,
  PetMemorial,
  PetMemorialInput,
} from '@pawfectpair/shared';
import {
  UPCOMING_DAYS_THRESHOLD,
  sanitizeText,
  sanitizeMessage,
  sanitizeUrl,
  validateStoragePath,
  isValidUuid,
  isValidPhone,
  GuardianZoneSchema,
  GuardianPingSchema,
  GuardianAlertSchema,
  ALERT_MESSAGE_MAX,
  PlannerTaskSchema,
  AdoptionListingSchema,
  AdoptionApplicationSchema,
  AdoptionStatusSchema,
  ApplicationStatusSchema,
  SosEventSchema,
  EmergencyContactSchema,
  TrainerProfileSchema,
  PetDayListingSchema,
  PetDayBookingSchema,
  PetEventSchema,
  EventRsvpSchema,
  EventStatusSchema,
  MarketProductSchema,
  MarketOrderSchema,
  MarketOrderStatusSchema,
  MarketProductStatusSchema,
  ForumPostSchema,
  ForumCommentSchema,
  TrainingSkillSchema,
  TrainingSessionSchema,
  TrainingSkillStatusSchema,
  ResqCaseSchema,
  ResqTipSchema,
  ResqStatusSchema,
  InsurancePolicySchema,
  InsuranceClaimSchema,
  PolicyStatusSchema,
  ClaimStatusSchema,
  LegacyPlanSchema,
  PetMemorialSchema,
} from '@pawfectpair/shared';

// ============================================================
// PROFILE
// ============================================================

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'bio'>>
): Promise<Profile> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  if (patch.phone && !isValidPhone(patch.phone)) throw new Error('Număr de telefon invalid');
  const safe = {
    ...(patch.full_name !== undefined && { full_name: sanitizeText(patch.full_name, 80) }),
    ...(patch.bio !== undefined && { bio: sanitizeText(patch.bio, 300) }),
    ...(patch.avatar_url !== undefined && { avatar_url: sanitizeUrl(patch.avatar_url) }),
    ...(patch.phone !== undefined && { phone: patch.phone ? sanitizeText(patch.phone, 20) : null }),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('profiles')
    .update(safe)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ============================================================
// PETS
// ============================================================

export async function fetchMyPets(userId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pet[];
}

export async function fetchPetById(id: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Pet | null;
}

export async function createPet(
  userId: string,
  input: PetInput
): Promise<Pet> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const safe = {
    ...input,
    name: sanitizeText(input.name, 50),
    breed: input.breed ? sanitizeText(input.breed, 50) : null,
    notes: input.notes ? sanitizeText(input.notes, 2000) : null,
    photo_url: sanitizeUrl(input.photo_url),
    // Pedigree (0028)
    pedigree_registered: input.pedigree_registered === true,
    pedigree_registry: input.pedigree_registry ? sanitizeText(input.pedigree_registry, 60) : null,
    pedigree_number: input.pedigree_number ? sanitizeText(input.pedigree_number, 60) : null,
    // Cadrul legal OUG 55/2002 (0028)
    dangerous_breed: input.dangerous_breed === true,
    oug50_category: input.oug50_category ?? 0,
    oug50_owner_18: input.oug50_owner_18 === true,
    oug50_registration: input.oug50_registration === true,
    oug50_microchip: input.oug50_microchip === true,
    oug50_insurance: input.oug50_insurance === true,
    oug50_sign: input.oug50_sign === true,
    oug50_sterilized: input.oug50_sterilized === true,
    owner_id: userId,
  };
  const { data, error } = await supabase
    .from('pets')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as Pet;
}

export async function updatePet(
  id: string,
  patch: Partial<Pet>
): Promise<Pet> {
  if (!isValidUuid(id)) throw new Error('ID animal invalid');
  const safe = {
    ...(patch.name !== undefined && { name: sanitizeText(patch.name, 50) }),
    ...(patch.breed !== undefined && { breed: patch.breed ? sanitizeText(patch.breed, 50) : null }),
    ...(patch.notes !== undefined && { notes: patch.notes ? sanitizeText(patch.notes, 2000) : null }),
    ...(patch.photo_url !== undefined && { photo_url: sanitizeUrl(patch.photo_url) }),
    ...(patch.species !== undefined && { species: patch.species }),
    ...(patch.sex !== undefined && { sex: patch.sex }),
    ...(patch.birth_date !== undefined && { birth_date: patch.birth_date }),
    // Pedigree (0028)
    ...(patch.pedigree_registered !== undefined && { pedigree_registered: patch.pedigree_registered === true }),
    ...(patch.pedigree_registry !== undefined && { pedigree_registry: patch.pedigree_registry ? sanitizeText(patch.pedigree_registry, 60) : null }),
    ...(patch.pedigree_number !== undefined && { pedigree_number: patch.pedigree_number ? sanitizeText(patch.pedigree_number, 60) : null }),
    // Cadrul legal OUG 55/2002 (0028)
    ...(patch.dangerous_breed !== undefined && { dangerous_breed: patch.dangerous_breed === true }),
    ...(patch.oug50_category !== undefined && { oug50_category: patch.oug50_category ?? 0 }),
    ...(patch.oug50_owner_18 !== undefined && { oug50_owner_18: patch.oug50_owner_18 === true }),
    ...(patch.oug50_registration !== undefined && { oug50_registration: patch.oug50_registration === true }),
    ...(patch.oug50_microchip !== undefined && { oug50_microchip: patch.oug50_microchip === true }),
    ...(patch.oug50_insurance !== undefined && { oug50_insurance: patch.oug50_insurance === true }),
    ...(patch.oug50_sign !== undefined && { oug50_sign: patch.oug50_sign === true }),
    ...(patch.oug50_sterilized !== undefined && { oug50_sterilized: patch.oug50_sterilized === true }),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('pets')
    .update(safe)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Pet;
}

export async function deletePet(id: string): Promise<void> {
  // FK CASCADE din DB șterge medical_records, weight_logs, pet_likes
  const { error } = await supabase.from('pets').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// MEDICAL RECORDS
// ============================================================

export async function fetchMedicalRecords(petId: string): Promise<MedicalRecord[]> {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('pet_id', petId)
    .order('record_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MedicalRecord[];
}

export async function fetchUpcomingRecords(
  userId: string
): Promise<Array<MedicalRecord & { pet: Pet }>> {
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date();
  limit.setDate(limit.getDate() + UPCOMING_DAYS_THRESHOLD);
  const limitStr = limit.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('medical_records')
    .select('*, pet:pets!inner(*)')
    .eq('pet.owner_id', userId)
    .not('due_date', 'is', null)
    .gte('due_date', today)
    .lte('due_date', limitStr)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<MedicalRecord & { pet: Pet }>;
}

export async function createMedicalRecord(
  input: MedicalRecordInput
): Promise<MedicalRecord> {
  if (!isValidUuid(input.pet_id)) throw new Error('ID animal invalid');
  const safe = {
    ...input,
    title: sanitizeText(input.title, 120),
    notes: input.notes ? sanitizeText(input.notes, 2000) : null,
  };
  const { data, error } = await supabase
    .from('medical_records')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as MedicalRecord;
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  const { error } = await supabase.from('medical_records').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// WEIGHT LOGS
// ============================================================

export async function fetchWeightLogs(petId: string): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('measured_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeightLog[];
}

export async function addWeightLog(
  input: WeightLogInput
): Promise<WeightLog> {
  if (!isValidUuid(input.pet_id)) throw new Error('ID animal invalid');
  const safe = {
    ...input,
    weight_kg: Math.min(Math.max(Number(input.weight_kg) || 0, 0.01), 500), // clamp 0.01-500
    notes: input.notes ? sanitizeText(input.notes, 500) : null,
  };
  const { data, error } = await supabase
    .from('weight_logs')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as WeightLog;
}

// ============================================================
// PETMATCH
// ============================================================

export async function fetchPetMatchCandidates(
  userId: string,
  filters: { species?: string; sex?: string } = {}
): Promise<Pet[]> {
  let q = supabase
    .from('pets')
    .select('*')
    .neq('owner_id', userId);

  if (filters.species) q = q.eq('species', filters.species);
  if (filters.sex) q = q.eq('sex', filters.sex);

  // Excludem animalele pe care utilizatorul le-a evaluat deja
  const { data: liked } = await supabase
    .from('pet_likes')
    .select('to_pet_id')
    .eq('from_pet_owner_id', userId);
  const likedIds = (liked ?? []).map((l) => l.to_pet_id);
  if (likedIds.length) q = q.not('id', 'in', `(${likedIds.join(',')})`);

  const { data, error } = await q.limit(50);
  if (error) throw error;
  return (data ?? []) as Pet[];
}

export async function likePet(fromPetId: string, toPetId: string): Promise<{ matched: boolean; match?: Match }> {
  // Edge function recomandat pentru atomicitate; aici varianta simplificată:
  const { data: existing } = await supabase
    .from('pet_likes')
    .select('id')
    .eq('from_pet_id', toPetId)
    .eq('to_pet_id', fromPetId)
    .maybeSingle();

  const { error: likeErr } = await supabase
    .from('pet_likes')
    .insert({ from_pet_id: fromPetId, to_pet_id: toPetId });
  if (likeErr) throw likeErr;

  if (existing) {
    // Match reciproc!
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .insert({ pet_a_id: fromPetId, pet_b_id: toPetId })
      .select()
      .single();
    if (matchErr) throw matchErr;
    return { matched: true, match: match as Match };
  }
  return { matched: false };
}

export async function passPet(fromPetId: string, toPetId: string): Promise<void> {
  // Înregistrăm un like cu flag pass, sau pur și simplu nu facem nimic —
  // depinde de schema. Aici doar marcăm că a fost văzut:
  const { error } = await supabase
    .from('pet_likes')
    .insert({ from_pet_id: fromPetId, to_pet_id: toPetId, passed: true });
  // Ignorăm erorile de unique constraint (deja evaluat)
  if (error && !error.message.includes('duplicate')) throw error;
}

// ============================================================
// CONVERSATIONS / MESSAGES
// ============================================================

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  // Conversații = matches în care utilizatorul are un animal participant
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      created_at,
      pet_a:pets!matches_pet_a_id_fkey(id, name, photo_url, species, owner_id),
      pet_b:pets!matches_pet_b_id_fkey(id, name, photo_url, species, owner_id)
    `)
    .or(`pet_a.owner_id.eq.${userId},pet_b.owner_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as any[];
  return rows
    .map((m) => {
      const isA = m.pet_a?.owner_id === userId;
      const other_pet = isA ? m.pet_b : m.pet_a;
      if (!other_pet) return null;
      return {
        match: { id: m.id, created_at: m.created_at, pet_a_id: m.pet_a.id, pet_b_id: m.pet_b.id },
        other_pet,
        other_owner: {} as any,            // populated via separate query if needed
        last_message: null,
        unread_count: 0,
      } as Conversation;
    })
    .filter((c): c is Conversation => c !== null);
}

export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message> {
  if (!isValidUuid(matchId)) throw new Error('ID match invalid');
  if (!isValidUuid(senderId)) throw new Error('ID utilizator invalid');
  const safeContent = sanitizeMessage(content);
  if (!safeContent) throw new Error('Mesajul nu poate fi gol');
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content: safeContent })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

export async function markMessageRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);
  if (error) throw error;
}

// ============================================================
// STORAGE
// ============================================================

export async function uploadPetPhoto(
  fileUri: string,
  userId: string,
  ext: string = 'jpg'
): Promise<string> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const path = `${userId}/${uuid}.${ext}`;
  // Validare path — previne path traversal și foldere altora
  if (!validateStoragePath(path, userId)) {
    throw new Error('Path de stocare invalid');
  }
  const fileResp = await fetch(fileUri);
  const blob = await fileResp.blob();

  const { error } = await supabase.storage
    .from('public-media')
    .upload(path, blob, { cacheControl: '3600', contentType: blob.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('public-media').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// PETGUARDIAN — zone sigure (geofencing)
// VALIDARE DUBLĂ: Zod aici + check constraints în DB (0021_petguardian.sql)
// ============================================================

export async function fetchGuardianZones(petId: string): Promise<GuardianZone[]> {
  if (!isValidUuid(petId)) throw new Error('ID animal invalid');
  const { data, error } = await supabase
    .from('guardian_zones')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GuardianZone[];
}

export async function createGuardianZone(
  petId: string,
  input: GuardianZoneInput
): Promise<GuardianZone> {
  if (!isValidUuid(petId)) throw new Error('ID animal invalid');
  // Zod aruncă eroare lizibilă dacă datele sunt invalide (lat/lng/radius)
  const parsed = GuardianZoneSchema.parse(input);
  const { data, error } = await supabase
    .from('guardian_zones')
    .insert({
      pet_id: petId,
      name: sanitizeText(parsed.name, 40),
      center_lat: parsed.center_lat,
      center_lng: parsed.center_lng,
      radius_m: parsed.radius_m,
      active: parsed.active ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as GuardianZone;
}

export async function deleteGuardianZone(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID zonă invalid');
  const { error } = await supabase.from('guardian_zones').delete().eq('id', id);
  if (error) throw error;
}

export async function setGuardianZoneActive(id: string, active: boolean): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID zonă invalid');
  const { error } = await supabase
    .from('guardian_zones')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETGUARDIAN — pings (istoric locații)
// ============================================================

export async function fetchLatestGuardianPing(petId: string): Promise<GuardianPing | null> {
  if (!isValidUuid(petId)) throw new Error('ID animal invalid');
  const { data, error } = await supabase
    .from('guardian_pings')
    .select('*')
    .eq('pet_id', petId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as GuardianPing | null;
}

export async function recordGuardianPing(input: GuardianPingInput): Promise<GuardianPing> {
  const parsed = GuardianPingSchema.parse(input);
  const { data, error } = await supabase
    .from('guardian_pings')
    .insert({
      pet_id: parsed.pet_id,
      lat: parsed.lat,
      lng: parsed.lng,
      source: parsed.source,
    })
    .select()
    .single();
  if (error) throw error;
  return data as GuardianPing;
}

// ============================================================
// PETGUARDIAN — alerte
// ============================================================

export async function fetchGuardianAlerts(petId: string, limit = 50): Promise<GuardianAlert[]> {
  if (!isValidUuid(petId)) throw new Error('ID animal invalid');
  const { data, error } = await supabase
    .from('guardian_alerts')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(100, Math.floor(limit))));
  if (error) throw error;
  return (data ?? []) as GuardianAlert[];
}

export async function createGuardianAlert(
  petId: string,
  zoneId: string | null,
  type: GuardianAlertType,
  message: string
): Promise<GuardianAlert> {
  const parsed = GuardianAlertSchema.parse({
    pet_id: petId,
    zone_id: zoneId,
    type,
    message: sanitizeText(message, ALERT_MESSAGE_MAX),
  });
  const { data, error } = await supabase
    .from('guardian_alerts')
    .insert(parsed)
    .select()
    .single();
  if (error) throw error;
  return data as GuardianAlert;
}

export async function acknowledgeGuardianAlert(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID alertă invalid');
  const { error } = await supabase
    .from('guardian_alerts')
    .update({ acknowledged: true })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETPLANNER — activități planificate (0022_petplanner.sql)
// VALIDARE DUBLĂ: Zod aici + check constraints în DB
// ============================================================

/**
 * Activitățile de planificate ale owner-ului curent (RLS filtrează).
 * @param petId  opțional — filtrează pe un singur animal
 * @param includeDone  include și activitățile finalizate (default true)
 * @param limit  plafon anti-flood (default 200)
 */
export async function fetchPlannerTasks(
  petId?: string,
  includeDone = true,
  limit = 200
): Promise<PlannerTask[]> {
  if (petId !== undefined && !isValidUuid(petId)) throw new Error('ID animal invalid');
  let q = supabase
    .from('planner_tasks')
    .select('*')
    .order('due_at', { ascending: true })
    .limit(Math.max(1, Math.min(500, limit)));
  if (!includeDone) q = q.eq('done', false);
  if (petId) q = q.eq('pet_id', petId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PlannerTask[];
}

export async function createPlannerTask(
  userId: string,
  input: PlannerTaskInput
): Promise<PlannerTask> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = PlannerTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Date activitate invalide');
  }
  const safe = {
    ...parsed.data,
    title: sanitizeText(parsed.data.title, 80),
    owner_id: userId,
  };
  const { data, error } = await supabase
    .from('planner_tasks')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as PlannerTask;
}

/** Marchează / demarchează o activitate ca finalizată. */
export async function setPlannerTaskDone(id: string, done: boolean): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID activitate invalid');
  const { error } = await supabase
    .from('planner_tasks')
    .update({ done })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePlannerTask(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID activitate invalid');
  const { error } = await supabase.from('planner_tasks').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// ADOPTII — anunțuri & aplicații (0023_adoptii.sql)
// VALIDARE DUBLĂ: Zod aici + check constraints în DB
// ============================================================

/**
 * Anunțuri de adoptare (public, RLS: select pentru toți).
 * Include autorul (join profiles) pentru afișare în card.
 */
export async function fetchAdoptionListings(
  filters: AdoptionFilters = {}
): Promise<AdoptionListing[]> {
  let q = supabase
    .from('adoption_listings')
    .select('*, poster:profiles!adoption_listings_posted_by_fkey(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.species) q = q.eq('species', filters.species);
  if (filters.city && filters.city.trim()) {
    q = q.ilike('city', `%${sanitizeText(filters.city, 60)}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdoptionListing[];
}

/** Anunțurile mele (pentru tab „Anunțurile mele"). */
export async function fetchMyAdoptionListings(userId: string): Promise<AdoptionListing[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('adoption_listings')
    .select('*')
    .eq('posted_by', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AdoptionListing[];
}

export async function createAdoptionListing(
  userId: string,
  input: AdoptionListingInput
): Promise<AdoptionListing> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = AdoptionListingSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Date anunț invalide');
  }
  const safe = {
    ...parsed.data,
    name: sanitizeText(parsed.data.name, 50),
    breed: parsed.data.breed ? sanitizeText(parsed.data.breed, 50) : null,
    description: parsed.data.description ? sanitizeText(parsed.data.description, 1000) : null,
    city: parsed.data.city ? sanitizeText(parsed.data.city, 60) : null,
    photo_url: sanitizeUrl(parsed.data.photo_url),
    posted_by: userId,
  };
  const { data, error } = await supabase
    .from('adoption_listings')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as AdoptionListing;
}

export async function updateAdoptionStatus(id: string, status: AdoptionStatus): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID anunț invalid');
  const check = AdoptionStatusSchema.safeParse(status);
  if (!check.success) throw new Error('Status invalid');
  const { error } = await supabase
    .from('adoption_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAdoptionListing(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID anunț invalid');
  const { error } = await supabase.from('adoption_listings').delete().eq('id', id);
  if (error) throw error;
}

/** Aplică la un anunț (unique(listing_id, applicant_id) blochează duplicatele). */
export async function applyToAdoption(
  userId: string,
  listingId: string,
  message?: string
): Promise<AdoptionApplication> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  if (!isValidUuid(listingId)) throw new Error('ID anunț invalid');
  const parsed = AdoptionApplicationSchema.safeParse({ listing_id: listingId, message });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Aplicație invalidă');
  }
  const safe = {
    ...parsed.data,
    message: parsed.data.message ? sanitizeMessage(parsed.data.message) : null,
    applicant_id: userId,
  };
  const { data, error } = await supabase
    .from('adoption_applications')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as AdoptionApplication;
}

/** Aplicațiile primite pentru un anunț (doar autorul le vede — RLS). */
export async function fetchListingApplications(
  listingId: string
): Promise<AdoptionApplication[]> {
  if (!isValidUuid(listingId)) throw new Error('ID anunț invalid');
  const { data, error } = await supabase
    .from('adoption_applications')
    .select('*, applicant:profiles!adoption_applications_applicant_id_fkey(full_name, avatar_url)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown> & { applicant?: { full_name: string | null; avatar_url: string | null } | null }) => ({
    ...row,
    applicant_name: row.applicant?.full_name ?? null,
    applicant_avatar: row.applicant?.avatar_url ?? null,
  })) as unknown as AdoptionApplication[];
}

/** Aplicațiile mele (candidat) — cu numele anunțului. */
export async function fetchMyApplications(userId: string): Promise<AdoptionApplication[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('adoption_applications')
    .select('*, listing:adoption_listings(id, name, status)')
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown> & { listing?: { name: string } | null }) => ({
    ...row,
    listing_name: row.listing?.name ?? null,
  })) as unknown as AdoptionApplication[];
}

/** Retrage aplicația (candidat) sau decide (autor). */
export async function setApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID aplicație invalid');
  const check = ApplicationStatusSchema.safeParse(status);
  if (!check.success) throw new Error('Status invalid');
  const { error } = await supabase
    .from('adoption_applications')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETSOS — urgențe (0025_petsos.sql)
// VALIDARE DUBLĂ: Zod aici + check constraints în DB
// ============================================================

export async function fetchSosEvents(userId: string, limit = 20): Promise<SosEvent[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('sos_events')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(100, limit)));
  if (error) throw error;
  return (data ?? []) as SosEvent[];
}

export async function createSosEvent(
  userId: string,
  input: { pet_id: string; type: SosEventType; notes?: string | null }
): Promise<SosEvent> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = SosEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Date SOS invalide');
  }
  const safe = {
    ...parsed.data,
    notes: parsed.data.notes ? sanitizeMessage(parsed.data.notes) : null,
    owner_id: userId,
  };
  const { data, error } = await supabase
    .from('sos_events')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as SosEvent;
}

/** Salvează contactul de urgență pe animal (0025: coloane pe pets). */
export async function setPetEmergencyContact(
  petId: string,
  contact: { emergency_contact_name: string | null; emergency_contact_phone: string | null }
): Promise<void> {
  if (!isValidUuid(petId)) throw new Error('ID animal invalid');
  const parsed = EmergencyContactSchema.safeParse(contact);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Contact invalid');
  }
  const { error } = await supabase
    .from('pets')
    .update({
      emergency_contact_name: parsed.data.emergency_contact_name
        ? sanitizeText(parsed.data.emergency_contact_name, 60)
        : null,
      emergency_contact_phone: parsed.data.emergency_contact_phone
        ? sanitizeText(parsed.data.emergency_contact_phone, 20)
        : null,
    })
    .eq('id', petId);
  if (error) throw error;
}

// ============================================================
// PETEDU — articole educaționale + traineri (0026_petedu.sql)
// Articole: public read-only (admin manage). Traineri: profil propriu.
// ============================================================

export async function fetchEduArticles(
  filters: EduFilters = {},
  limit = 200
): Promise<EduArticle[]> {
  let q = supabase
    .from('edu_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(500, limit)));
  if (filters.species) q = q.eq('species', filters.species);
  if (filters.category) q = q.eq('category', filters.category);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as EduArticle[];
  // căutarea text o facem local (diacritice-insensibil, util RO)
  if (filters.search && filters.search.trim()) {
    const needle = filters.search
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    return rows.filter((a) =>
      `${a.title} ${a.body}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(needle)
    );
  }
  return rows;
}

/** Director public de traineri — doar profiluri active (RLS filtrează restul). */
export async function fetchTrainers(
  filters: TrainerFilters = {},
  limit = 100
): Promise<Trainer[]> {
  let q = supabase
    .from('edu_trainers')
    .select('*')
    .order('verified', { ascending: false })
    .order('experience_years', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(200, limit)));
  if (filters.specialty) {
    q = q.contains('specialties', [filters.specialty]);
  }
  if (filters.city && filters.city.trim()) {
    q = q.ilike('city', `%${sanitizeText(filters.city, 60)}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Trainer[];
  if (filters.search && filters.search.trim()) {
    const needle = filters.search
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    return rows.filter((t) =>
      `${t.display_name} ${t.bio ?? ''} ${t.city ?? ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(needle)
    );
  }
  return rows;
}

export async function fetchMyTrainerProfile(userId: string): Promise<Trainer | null> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('edu_trainers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Trainer | null;
}

/** Salvează (upsert) profilul trainer al utilizatorului — un profil per user. */
export async function upsertTrainerProfile(
  userId: string,
  input: TrainerInput
): Promise<Trainer> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = TrainerProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Date trainer invalide');
  }
  const safe = {
    display_name: sanitizeText(parsed.data.display_name, 60),
    specialties: parsed.data.specialties,
    city: parsed.data.city ? sanitizeText(parsed.data.city, 60) : null,
    bio: parsed.data.bio ? sanitizeMessage(parsed.data.bio) : null,
    experience_years: parsed.data.experience_years,
    phone: parsed.data.phone ? sanitizeText(parsed.data.phone, 20) : null,
    price_range: parsed.data.price_range ? sanitizeText(parsed.data.price_range, 30) : null,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('edu_trainers')
    .upsert(safe, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as Trainer;
}

/** Activează/dezactivează profilul trainer (rămâne în listă doar când activ). */
export async function setTrainerActive(userId: string, active: boolean): Promise<void> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { error } = await supabase
    .from('edu_trainers')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteTrainerProfile(userId: string): Promise<void> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { error } = await supabase.from('edu_trainers').delete().eq('user_id', userId);
  if (error) throw error;
}

// ============================================================
// PETDAY — pet-sitting / plimbare / pet-hotel (0027)
// ============================================================

export async function fetchPetdayListings(
  filters: PetDayFilters = {},
  limit = 200
): Promise<PetDayListingWithOwner[]> {
  const lim = Math.min(500, Math.max(1, limit));
  let q = supabase
    .from('petday_listings')
    .select('*, owner:profiles!petday_listings_user_id_fkey(id, full_name, avatar_url)')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(lim);
  if (filters.providerType) q = q.eq('provider_type', filters.providerType);
  if (filters.service) q = q.contains('services', [filters.service]);
  if (filters.city) q = q.ilike('city', `%${filters.city.replace(/[%_]/g, '')}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PetDayListingWithOwner[];
}

export async function fetchMyPetdayListings(userId: string): Promise<PetDayListing[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('petday_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PetDayListing[];
}

export async function createPetdayListing(
  userId: string,
  input: PetDayListingInput
): Promise<PetDayListing> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = PetDayListingSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Date ofertă invalide');
  }
  const safe = {
    user_id: userId,
    title: sanitizeText(parsed.data.title, 80),
    provider_type: parsed.data.provider_type,
    services: parsed.data.services,
    city: sanitizeText(parsed.data.city, 60),
    description: parsed.data.description ? sanitizeMessage(parsed.data.description) : null,
    address: parsed.data.address ? sanitizeText(parsed.data.address, 120) : null,
    price_from: parsed.data.price_from,
    price_unit: parsed.data.price_unit,
    max_pets: parsed.data.max_pets,
    accepts_dogs: parsed.data.accepts_dogs,
    accepts_cats: parsed.data.accepts_cats,
    accepts_other: parsed.data.accepts_other,
    photo_url: sanitizeUrl(parsed.data.photo_url),
    phone: parsed.data.phone ? sanitizeText(parsed.data.phone, 20) : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('petday_listings')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as PetDayListing;
}

export async function updatePetdayListing(
  id: string,
  input: PetDayListingInput
): Promise<PetDayListing> {
  if (!isValidUuid(id)) throw new Error('ID ofertă invalid');
  const parsed = PetDayListingSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Date ofertă invalide');
  }
  const safe = {
    title: sanitizeText(parsed.data.title, 80),
    provider_type: parsed.data.provider_type,
    services: parsed.data.services,
    city: sanitizeText(parsed.data.city, 60),
    description: parsed.data.description ? sanitizeMessage(parsed.data.description) : null,
    address: parsed.data.address ? sanitizeText(parsed.data.address, 120) : null,
    price_from: parsed.data.price_from,
    price_unit: parsed.data.price_unit,
    max_pets: parsed.data.max_pets,
    accepts_dogs: parsed.data.accepts_dogs,
    accepts_cats: parsed.data.accepts_cats,
    accepts_other: parsed.data.accepts_other,
    photo_url: sanitizeUrl(parsed.data.photo_url),
    phone: parsed.data.phone ? sanitizeText(parsed.data.phone, 20) : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('petday_listings')
    .update(safe)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PetDayListing;
}

export async function setPetdayListingActive(id: string, active: boolean): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID ofertă invalid');
  const { error } = await supabase
    .from('petday_listings')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePetdayListing(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID ofertă invalid');
  const { error } = await supabase.from('petday_listings').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPetdayBookingsAsOwner(
  userId: string
): Promise<PetDayBookingWithRefs[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('petday_bookings')
    .select(
      '*, pet:pets(id, name, photo_url), listing:petday_listings(id, title, city, provider_type, user_id)'
    )
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as PetDayBookingWithRefs[];
}

export async function fetchPetdayBookingsForMyListings(
  userId: string
): Promise<PetDayBookingWithRefs[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  // 1) id-urile ofertelor mele
  const { data: idsData, error: idsErr } = await supabase
    .from('petday_listings')
    .select('id')
    .eq('user_id', userId);
  if (idsErr) throw idsErr;
  const ids = (idsData ?? []).map((r) => r.id);
  if (ids.length === 0) return [];
  // 2) rezervările pe acele oferte (fără filtru pe embed aliasat)
  const { data, error } = await supabase
    .from('petday_bookings')
    .select(
      '*, pet:pets(id, name, photo_url), listing:petday_listings(id, title, city, provider_type, user_id)'
    )
    .in('listing_id', ids)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as PetDayBookingWithRefs[];
}

export async function createPetdayBooking(
  userId: string,
  input: PetDayBookingInput
): Promise<PetDayBooking> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = PetDayBookingSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Rezervare invalidă');
  }
  const safe = {
    owner_id: userId,
    listing_id: parsed.data.listing_id,
    pet_id: parsed.data.pet_id,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    note: parsed.data.note ? sanitizeMessage(parsed.data.note) : null,
  };
  const { data, error } = await supabase
    .from('petday_bookings')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as PetDayBooking;
}

export async function setPetdayBookingStatus(
  id: string,
  status: PetDayBookingStatus
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID rezervare invalid');
  const { error } = await supabase
    .from('petday_bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// PET EVENTS
// ============================================================

interface RawEventRow {
  [key: string]: unknown;
  participants?: { count: number }[] | null;
}

function mapEventRow(row: RawEventRow): PetEventWithRefs {
  const counts = Array.isArray(row.participants) ? row.participants : [];
  const { participants, ...rest } = row;
  return {
    ...(rest as unknown as PetEvent),
    participant_count: counts.length > 0 ? Number(counts[0]?.count ?? 0) : 0,
  };
}

export async function fetchEvents(filters: PetEventFilters): Promise<PetEventWithRefs[]> {
  let q = supabase
    .from('pet_events')
    .select(
      '*, organizer:profiles(id, full_name, avatar_url), participants:event_participants(count)'
    )
    .eq('status', 'published')
    .order('starts_at', { ascending: true })
    .limit(200);
  if (filters.eventType) q = q.eq('event_type', filters.eventType);
  if (filters.audience) q = q.eq('audience', filters.audience);
  if (filters.city) q = q.ilike('city', `%${filters.city}%`);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as RawEventRow[]).map(mapEventRow);
}

export async function fetchMyEvents(userId: string): Promise<PetEventWithRefs[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('pet_events')
    .select('*, organizer:profiles(id, full_name, avatar_url), participants:event_participants(count)')
    .eq('organizer_id', userId)
    .order('starts_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as RawEventRow[]).map(mapEventRow);
}

export async function createEvent(userId: string, input: PetEventInput): Promise<PetEvent> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = PetEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Eveniment invalid');
  }
  const safe = {
    organizer_id: userId,
    title: sanitizeText(parsed.data.title),
    description: parsed.data.description ? sanitizeMessage(parsed.data.description) : null,
    event_type: parsed.data.event_type,
    audience: parsed.data.audience,
    city: sanitizeText(parsed.data.city),
    location: parsed.data.location ? sanitizeText(parsed.data.location) : null,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    max_participants: parsed.data.max_participants,
    photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
    contact_phone: parsed.data.contact_phone
      ? sanitizeText(parsed.data.contact_phone)
      : null,
    status: 'published',
  };
  const { data, error } = await supabase
    .from('pet_events')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as PetEvent;
}

export async function updateEvent(id: string, input: PetEventInput): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID eveniment invalid');
  const parsed = PetEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Eveniment invalid');
  }
  const safe = {
    title: sanitizeText(parsed.data.title),
    description: parsed.data.description ? sanitizeMessage(parsed.data.description) : null,
    event_type: parsed.data.event_type,
    audience: parsed.data.audience,
    city: sanitizeText(parsed.data.city),
    location: parsed.data.location ? sanitizeText(parsed.data.location) : null,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    max_participants: parsed.data.max_participants,
    photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
    contact_phone: parsed.data.contact_phone
      ? sanitizeText(parsed.data.contact_phone)
      : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('pet_events').update(safe).eq('id', id);
  if (error) throw error;
}

export async function setEventStatus(id: string, status: EventStatus): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID eveniment invalid');
  const parsed = EventStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status eveniment invalid');
  const { error } = await supabase
    .from('pet_events')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID eveniment invalid');
  const { error } = await supabase.from('pet_events').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMyRsvps(userId: string): Promise<EventParticipant[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as EventParticipant[];
}

export async function setEventRsvp(
  userId: string,
  input: EventRsvpInput
): Promise<void> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = EventRsvpSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'RSVP invalid');
  }
  const { error } = await supabase
    .from('event_participants')
    .upsert(
      {
        event_id: parsed.data.event_id,
        user_id: userId,
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,user_id' }
    );
  if (error) throw error;
}

export async function fetchEventParticipants(
  eventId: string
): Promise<EventParticipantWithProfile[]> {
  if (!isValidUuid(eventId)) throw new Error('ID eveniment invalid');
  const { data, error } = await supabase
    .from('event_participants')
    .select('*, profile:profiles(id, full_name, avatar_url)')
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as EventParticipantWithProfile[];
}

// ============================================================
// PET MARKET
// ============================================================

export async function fetchMarketProducts(
  filters: MarketFilters
): Promise<MarketProductWithSeller[]> {
  let q = supabase
    .from('products')
    .select('*, seller:profiles(id, full_name, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(200);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.condition) q = q.eq('condition', filters.condition);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MarketProductWithSeller[];
}

export async function fetchMyProducts(userId: string): Promise<MarketProductWithSeller[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as MarketProductWithSeller[];
}

export async function createMarketProduct(
  userId: string,
  input: MarketProductInput
): Promise<MarketProduct> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = MarketProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Produs invalid');
  }
  const safe = {
    seller_id: userId,
    name: sanitizeText(parsed.data.name),
    description: parsed.data.description ? sanitizeMessage(parsed.data.description) : null,
    category: parsed.data.category,
    price_cents: parsed.data.price_cents,
    currency: 'RON',
    stock: parsed.data.stock,
    condition: parsed.data.condition,
    city: sanitizeText(parsed.data.city),
    delivery_info: parsed.data.delivery_info ? sanitizeText(parsed.data.delivery_info) : null,
    photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
    status: 'active',
  };
  const { data, error } = await supabase.from('products').insert(safe).select().single();
  if (error) throw error;
  return data as MarketProduct;
}

export async function updateMarketProduct(
  id: string,
  input: MarketProductInput
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID produs invalid');
  const parsed = MarketProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Produs invalid');
  }
  const safe = {
    name: sanitizeText(parsed.data.name),
    description: parsed.data.description ? sanitizeMessage(parsed.data.description) : null,
    category: parsed.data.category,
    price_cents: parsed.data.price_cents,
    stock: parsed.data.stock,
    condition: parsed.data.condition,
    city: sanitizeText(parsed.data.city),
    delivery_info: parsed.data.delivery_info ? sanitizeText(parsed.data.delivery_info) : null,
    photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('products').update(safe).eq('id', id);
  if (error) throw error;
}

export async function setMarketProductStatus(
  id: string,
  status: MarketProductStatus
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID produs invalid');
  const parsed = MarketProductStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status produs invalid');
  const { error } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMarketProduct(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID produs invalid');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMyOrders(userId: string): Promise<MarketOrderWithItems[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, items:order_items(id, quantity, unit_price_cents, product:products(id, name, photo_url))'
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as MarketOrderWithItems[];
}

/** Liniile de comandă primite pe produsele mele (flux vânzător). */
export interface SellerOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
  product?: Pick<MarketProduct, 'id' | 'name' | 'photo_url'> | null;
  order?: {
    id: string;
    status: MarketOrderStatus;
    created_at: string;
    total_cents: number;
    currency: string;
    buyer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  } | null;
}

export async function fetchSellerOrderItems(userId: string): Promise<SellerOrderItem[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  // 1) id-urile produselor mele
  const { data: idsData, error: idsErr } = await supabase
    .from('products')
    .select('id')
    .eq('seller_id', userId);
  if (idsErr) throw idsErr;
  const ids = (idsData ?? []).map((r) => r.id);
  if (ids.length === 0) return [];
  // 2) liniile de comandă pe acele produse
  const { data, error } = await supabase
    .from('order_items')
    .select(
      '*, product:products(id, name, photo_url), order:orders(id, status, created_at, total_cents, currency, buyer:profiles(id, full_name, avatar_url))'
    )
    .in('product_id', ids)
    .order('id', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as SellerOrderItem[];
}

export async function createMarketOrder(
  userId: string,
  input: MarketOrderInput
): Promise<MarketOrder> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = MarketOrderSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Comandă invalidă');
  }
  // Verific produsul (activ, stoc suficient, nu propriul produs)
  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, price_cents, currency, stock, status, seller_id, name')
    .eq('id', parsed.data.product_id)
    .single();
  if (pErr) throw pErr;
  if (!product) throw new Error('Produsul nu a fost găsit');
  if (product.status !== 'active') throw new Error('Produsul nu mai este disponibil');
  if ((product.stock ?? 0) < parsed.data.quantity) {
    throw new Error('Stoc insuficient');
  }
  if (product.seller_id === userId) {
    throw new Error('Nu poți comanda propriul produs');
  }
  const total = product.price_cents * parsed.data.quantity;
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      buyer_id: userId,
      status: 'pending',
      total_cents: total,
      currency: product.currency ?? 'RON',
    })
    .select()
    .single();
  if (oErr) throw oErr;
  const { error: iErr } = await supabase.from('order_items').insert({
    order_id: (order as MarketOrder).id,
    product_id: parsed.data.product_id,
    quantity: parsed.data.quantity,
    unit_price_cents: product.price_cents,
  });
  if (iErr) throw iErr;
  return order as MarketOrder;
}

export async function setMarketOrderStatus(
  id: string,
  status: MarketOrderStatus
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID comandă invalid');
  const parsed = MarketOrderStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status comandă invalid');
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// PET CONNECT (forum)
// ============================================================

interface RawPostRow {
  [key: string]: unknown;
  forum_comments?: { count: number }[] | null;
}

function mapPostRow(row: RawPostRow): ForumPostWithRefs {
  const counts = Array.isArray(row.forum_comments) ? row.forum_comments : [];
  const { forum_comments, ...rest } = row;
  return {
    ...(rest as unknown as ForumPost),
    comments_count: counts.length > 0 ? Number(counts[0]?.count ?? 0) : 0,
  };
}

export async function fetchForumPosts(): Promise<ForumPostWithRefs[]> {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(
      '*, author:profiles(id, full_name, avatar_url), forum_comments(count)'
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as RawPostRow[]).map(mapPostRow);
}

export async function fetchMyForumPosts(userId: string): Promise<ForumPostWithRefs[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, author:profiles(id, full_name, avatar_url), forum_comments(count)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as RawPostRow[]).map(mapPostRow);
}

export async function createForumPost(
  userId: string,
  input: ForumPostInput
): Promise<ForumPost> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = ForumPostSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Postare invalidă');
  }
  const safe = {
    author_id: userId,
    title: sanitizeText(parsed.data.title),
    body: sanitizeMessage(parsed.data.body),
    category: parsed.data.category,
  };
  const { data, error } = await supabase.from('forum_posts').insert(safe).select().single();
  if (error) throw error;
  return data as ForumPost;
}

export async function deleteForumPost(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID postare invalid');
  const { error } = await supabase.from('forum_posts').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPostComments(
  postId: string
): Promise<ForumCommentWithAuthor[]> {
  if (!isValidUuid(postId)) throw new Error('ID postare invalid');
  const { data, error } = await supabase
    .from('forum_comments')
    .select('*, author:profiles(id, full_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as ForumCommentWithAuthor[];
}

export async function createForumComment(
  userId: string,
  input: ForumCommentInput
): Promise<ForumComment> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = ForumCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Comentariu invalid');
  }
  const safe = {
    post_id: parsed.data.post_id,
    author_id: userId,
    body: sanitizeMessage(parsed.data.body),
  };
  const { data, error } = await supabase.from('forum_comments').insert(safe).select().single();
  if (error) throw error;
  return data as ForumComment;
}

export async function deleteForumComment(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID comentariu invalid');
  const { error } = await supabase.from('forum_comments').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETTRAINING — dresaj & stimulare cognitivă (0032_pettraining.sql)
// Date personale: RLS owner-only pe ambele tabele.
// ============================================================

export async function fetchTrainingSkills(
  userId: string,
  filters: TrainingFilters = {}
): Promise<TrainingSkill[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  let q = supabase
    .from('training_skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(300);
  if (filters.petId) q = q.eq('pet_id', filters.petId);
  if (filters.category) q = q.eq('category', filters.category);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as TrainingSkill[];
  return filters.includeMastered ? rows : rows.filter((r) => r.status !== 'mastered');
}

export async function fetchTrainingSessions(
  userId: string,
  opts: { skillId?: string | null; petId?: string | null; limit?: number } = {}
): Promise<TrainingSession[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  let q = supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('practiced_at', { ascending: false })
    .limit(Math.max(1, Math.min(500, opts.limit ?? 300)));
  if (opts.skillId) q = q.eq('skill_id', opts.skillId);
  if (opts.petId) q = q.eq('pet_id', opts.petId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TrainingSession[];
}

export async function createTrainingSkill(
  userId: string,
  input: TrainingSkillInput
): Promise<TrainingSkill> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = TrainingSkillSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Abilitate invalidă');
  }
  const safe = {
    user_id: userId,
    pet_id: parsed.data.pet_id,
    name: sanitizeText(parsed.data.name, 60),
    category: parsed.data.category,
    difficulty: parsed.data.difficulty,
    target_sessions: parsed.data.target_sessions,
  };
  const { data, error } = await supabase
    .from('training_skills')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as TrainingSkill;
}

export async function updateTrainingSkill(
  id: string,
  input: TrainingSkillInput
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID abilitate invalid');
  const parsed = TrainingSkillSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Abilitate invalidă');
  }
  const { error } = await supabase
    .from('training_skills')
    .update({
      pet_id: parsed.data.pet_id,
      name: sanitizeText(parsed.data.name, 60),
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
      target_sessions: parsed.data.target_sessions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setTrainingSkillStatus(
  id: string,
  status: TrainingSkillStatus
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID abilitate invalid');
  const parsed = TrainingSkillStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status abilitate invalid');
  const { error } = await supabase
    .from('training_skills')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTrainingSkill(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID abilitate invalid');
  const { error } = await supabase.from('training_skills').delete().eq('id', id);
  if (error) throw error;
}

export async function createTrainingSession(
  userId: string,
  input: TrainingSessionInput,
  petId?: string | null
): Promise<TrainingSession> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = TrainingSessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Sesiune invalidă');
  }
  const safe: Record<string, unknown> = {
    user_id: userId,
    skill_id: parsed.data.skill_id,
    duration_minutes: parsed.data.duration_minutes,
    rating: parsed.data.rating,
    notes: parsed.data.notes ? sanitizeMessage(parsed.data.notes) : null,
    practiced_at: parsed.data.practiced_at ?? new Date().toISOString(),
  };
  if (petId && isValidUuid(petId)) safe.pet_id = petId;
  const { data, error } = await supabase
    .from('training_sessions')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as TrainingSession;
}

export async function deleteTrainingSession(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID sesiune invalid');
  const { error } = await supabase.from('training_sessions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETRESQ — animale pierdute/găsite (0033_petresq.sql)
// Cazuri publice (toți citesc), sfaturi comunitare publice.
// ============================================================

interface RawResqRow {
  tips?: { count: number }[];
  [key: string]: unknown;
}

function mapResqRow(row: RawResqRow): ResqCaseWithReporter {
  const { tips, ...rest } = row;
  return {
    ...(rest as unknown as ResqCaseWithReporter),
    tips_count: Array.isArray(tips) && tips[0]?.count != null ? tips[0].count : 0,
  };
}

export async function fetchResqCases(
  filters: ResqFilters = {},
  limit = 200
): Promise<ResqCaseWithReporter[]> {
  const lim = Math.min(500, Math.max(1, limit));
  let q = supabase
    .from('resq_cases')
    .select('*, reporter:profiles!resq_cases_reporter_id_fkey(id, full_name, avatar_url), tips:resq_tips(count)')
    .order('created_at', { ascending: false })
    .limit(lim);
  if (filters.type) q = q.eq('type', filters.type);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.city) q = q.ilike('city', `%${filters.city.replace(/[%_]/g, '')}%`);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as RawResqRow[]).map(mapResqRow);
}

export async function fetchMyResqCases(userId: string): Promise<ResqCaseWithReporter[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('resq_cases')
    .select('*, reporter:profiles!resq_cases_reporter_id_fkey(id, full_name, avatar_url), tips:resq_tips(count)')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as RawResqRow[]).map(mapResqRow);
}

export async function createResqCase(
  userId: string,
  input: ResqCaseInput
): Promise<ResqCase> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = ResqCaseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Caz invalid');
  }
  const safe = {
    reporter_id: userId,
    pet_id: parsed.data.pet_id,
    type: parsed.data.type,
    name: sanitizeText(parsed.data.name, 60),
    species: parsed.data.species,
    description: sanitizeMessage(parsed.data.description),
    city: parsed.data.city ? sanitizeText(parsed.data.city, 60) : null,
    last_seen_location: parsed.data.last_seen_location
      ? sanitizeText(parsed.data.last_seen_location, 120)
      : null,
    contact_phone: parsed.data.contact_phone ? sanitizeText(parsed.data.contact_phone, 20) : null,
    photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
  };
  const { data, error } = await supabase.from('resq_cases').insert(safe).select().single();
  if (error) throw error;
  return data as ResqCase;
}

export async function updateResqCase(
  id: string,
  input: ResqCaseInput
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID caz invalid');
  const parsed = ResqCaseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Caz invalid');
  }
  const { error } = await supabase
    .from('resq_cases')
    .update({
      pet_id: parsed.data.pet_id,
      type: parsed.data.type,
      name: sanitizeText(parsed.data.name, 60),
      species: parsed.data.species,
      description: sanitizeMessage(parsed.data.description),
      city: parsed.data.city ? sanitizeText(parsed.data.city, 60) : null,
      last_seen_location: parsed.data.last_seen_location
        ? sanitizeText(parsed.data.last_seen_location, 120)
        : null,
      contact_phone: parsed.data.contact_phone ? sanitizeText(parsed.data.contact_phone, 20) : null,
      photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setResqCaseStatus(id: string, status: ResqStatus): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID caz invalid');
  const parsed = ResqStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status caz invalid');
  const { error } = await supabase
    .from('resq_cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteResqCase(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID caz invalid');
  const { error } = await supabase.from('resq_cases').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchResqTips(caseId: string): Promise<ResqTipWithAuthor[]> {
  if (!isValidUuid(caseId)) throw new Error('ID caz invalid');
  const { data, error } = await supabase
    .from('resq_tips')
    .select('*, author:profiles!resq_tips_user_id_fkey(id, full_name, avatar_url)')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ResqTipWithAuthor[];
}

export async function createResqTip(
  userId: string,
  input: { case_id: string; message: string }
): Promise<ResqTip> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = ResqTipSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Sfat invalid');
  }
  const { data, error } = await supabase
    .from('resq_tips')
    .insert({
      user_id: userId,
      case_id: parsed.data.case_id,
      message: sanitizeMessage(parsed.data.message),
    })
    .select()
    .single();
  if (error) throw error;
  return data as ResqTip;
}

export async function deleteResqTip(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID sfat invalid');
  const { error } = await supabase.from('resq_tips').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETINSURANCE — asigurări veterinare (0034_petinsurance.sql)
// Date financiare personale: RLS owner-only.
// ============================================================

export async function fetchInsurancePolicies(
  userId: string,
  filters: InsuranceFilters = {}
): Promise<InsurancePolicyWithPet[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  let q = supabase
    .from('insurance_policies')
    .select('*, pet:pets(id, name, photo_url)')
    .eq('user_id', userId)
    .order('end_date', { ascending: false })
    .limit(200);
  if (filters.petId) q = q.eq('pet_id', filters.petId);
  if (filters.policyType) q = q.eq('policy_type', filters.policyType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as InsurancePolicyWithPet[];
}

export async function createInsurancePolicy(
  userId: string,
  input: InsurancePolicyInput
): Promise<InsurancePolicy> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = InsurancePolicySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Poliță invalidă');
  }
  const safe = {
    user_id: userId,
    pet_id: parsed.data.pet_id,
    provider: sanitizeText(parsed.data.provider, 60),
    policy_number: parsed.data.policy_number ? sanitizeText(parsed.data.policy_number, 60) : null,
    policy_type: parsed.data.policy_type,
    premium_cents: parsed.data.premium_cents,
    coverage_limit_cents: parsed.data.coverage_limit_cents,
    deductible_cents: parsed.data.deductible_cents,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    notes: parsed.data.notes ? sanitizeMessage(parsed.data.notes) : null,
  };
  const { data, error } = await supabase
    .from('insurance_policies')
    .insert(safe)
    .select()
    .single();
  if (error) throw error;
  return data as InsurancePolicy;
}

export async function updateInsurancePolicy(
  id: string,
  input: InsurancePolicyInput
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID poliță invalid');
  const parsed = InsurancePolicySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Poliță invalidă');
  }
  const { error } = await supabase
    .from('insurance_policies')
    .update({
      pet_id: parsed.data.pet_id,
      provider: sanitizeText(parsed.data.provider, 60),
      policy_number: parsed.data.policy_number ? sanitizeText(parsed.data.policy_number, 60) : null,
      policy_type: parsed.data.policy_type,
      premium_cents: parsed.data.premium_cents,
      coverage_limit_cents: parsed.data.coverage_limit_cents,
      deductible_cents: parsed.data.deductible_cents,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      notes: parsed.data.notes ? sanitizeMessage(parsed.data.notes) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setInsurancePolicyStatus(
  id: string,
  status: PolicyStatus
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID poliță invalid');
  const parsed = PolicyStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status poliță invalid');
  const { error } = await supabase
    .from('insurance_policies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteInsurancePolicy(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID poliță invalid');
  const { error } = await supabase.from('insurance_policies').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchInsuranceClaims(
  userId: string,
  policyId?: string | null
): Promise<InsuranceClaimWithPolicy[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  let q = supabase
    .from('insurance_claims')
    .select('*, policy:insurance_policies(id, provider, policy_type)')
    .eq('user_id', userId)
    .order('claim_date', { ascending: false })
    .limit(300);
  if (policyId) q = q.eq('policy_id', policyId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as InsuranceClaimWithPolicy[];
}

export async function createInsuranceClaim(
  userId: string,
  input: InsuranceClaimInput
): Promise<InsuranceClaim> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = InsuranceClaimSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Despăgubire invalidă');
  }
  const { data, error } = await supabase
    .from('insurance_claims')
    .insert({
      user_id: userId,
      policy_id: parsed.data.policy_id,
      claim_date: parsed.data.claim_date,
      description: sanitizeMessage(parsed.data.description),
      amount_cents: parsed.data.amount_cents,
    })
    .select()
    .single();
  if (error) throw error;
  return data as InsuranceClaim;
}

export async function setInsuranceClaimStatus(
  id: string,
  status: ClaimStatus
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID despăgubire invalid');
  const parsed = ClaimStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Status despăgubire invalid');
  const { error } = await supabase
    .from('insurance_claims')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// PETLEGACY — plan îngrijire + memorial (0035_petlegacy.sql)
// Planuri: RLS owner-only. Memoriale: publice dacă is_public.
// ============================================================

export async function fetchLegacyPlans(userId: string): Promise<LegacyPlanWithPet[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('legacy_plans')
    .select('*, pet:pets(id, name, photo_url)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as LegacyPlanWithPet[];
}

/** Creează sau actualizează planul pentru un animal (un plan per animal, upsert). */
export async function upsertLegacyPlan(
  userId: string,
  input: LegacyPlanInput,
  existingId?: string | null
): Promise<LegacyPlan> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = LegacyPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Plan invalid');
  }
  const safe = {
    user_id: userId,
    pet_id: parsed.data.pet_id,
    guardian_name: sanitizeText(parsed.data.guardian_name, 80),
    guardian_phone: parsed.data.guardian_phone ? sanitizeText(parsed.data.guardian_phone, 20) : null,
    guardian_email: parsed.data.guardian_email ? sanitizeText(parsed.data.guardian_email, 80) : null,
    instructions: parsed.data.instructions ? sanitizeMessage(parsed.data.instructions) : null,
    care_budget_cents: parsed.data.care_budget_cents,
    wishes: parsed.data.wishes ? sanitizeMessage(parsed.data.wishes) : null,
    updated_at: new Date().toISOString(),
  };
  if (existingId && isValidUuid(existingId)) {
    const { data, error } = await supabase
      .from('legacy_plans')
      .update(safe)
      .eq('id', existingId)
      .select()
      .single();
    if (error) throw error;
    return data as LegacyPlan;
  }
  const { data, error } = await supabase.from('legacy_plans').insert(safe).select().single();
  if (error) throw error;
  return data as LegacyPlan;
}

export async function deleteLegacyPlan(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID plan invalid');
  const { error } = await supabase.from('legacy_plans').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMyMemorials(userId: string): Promise<PetMemorial[]> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const { data, error } = await supabase
    .from('pet_memorials')
    .select('*')
    .eq('user_id', userId)
    .order('passed_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as PetMemorial[];
}

export async function createMemorial(
  userId: string,
  input: PetMemorialInput
): Promise<PetMemorial> {
  if (!isValidUuid(userId)) throw new Error('ID utilizator invalid');
  const parsed = PetMemorialSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Memorial invalid');
  }
  const safe = {
    user_id: userId,
    pet_id: parsed.data.pet_id,
    pet_name: sanitizeText(parsed.data.pet_name, 60),
    species: parsed.data.species ? sanitizeText(parsed.data.species, 30) : null,
    photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
    tribute: parsed.data.tribute ? sanitizeMessage(parsed.data.tribute) : null,
    favorite_memory: parsed.data.favorite_memory
      ? sanitizeMessage(parsed.data.favorite_memory)
      : null,
    passed_at: parsed.data.passed_at,
    resting_place: parsed.data.resting_place ? sanitizeText(parsed.data.resting_place, 120) : null,
    is_public: parsed.data.is_public,
  };
  const { data, error } = await supabase.from('pet_memorials').insert(safe).select().single();
  if (error) throw error;
  return data as PetMemorial;
}

export async function updateMemorial(
  id: string,
  input: PetMemorialInput
): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID memorial invalid');
  const parsed = PetMemorialSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Memorial invalid');
  }
  const { error } = await supabase
    .from('pet_memorials')
    .update({
      pet_id: parsed.data.pet_id,
      pet_name: sanitizeText(parsed.data.pet_name, 60),
      species: parsed.data.species ? sanitizeText(parsed.data.species, 30) : null,
      photo_url: parsed.data.photo_url ? sanitizeUrl(parsed.data.photo_url) : null,
      tribute: parsed.data.tribute ? sanitizeMessage(parsed.data.tribute) : null,
      favorite_memory: parsed.data.favorite_memory
        ? sanitizeMessage(parsed.data.favorite_memory)
        : null,
      passed_at: parsed.data.passed_at,
      resting_place: parsed.data.resting_place ? sanitizeText(parsed.data.resting_place, 120) : null,
      is_public: parsed.data.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMemorial(id: string): Promise<void> {
  if (!isValidUuid(id)) throw new Error('ID memorial invalid');
  const { error } = await supabase.from('pet_memorials').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// NAMESPACE AGREGAT — folosit de hooks: import { queries } from '...'
// (FIX: înainte lipsa complet, hooks-urile nu puteau compila)
// ============================================================
export const queries = {
  // Profile
  fetchProfile,
  updateProfile,
  // Pets
  fetchMyPets,
  fetchPetById,
  createPet,
  updatePet,
  deletePet,
  // Medical
  fetchMedicalRecords,
  fetchUpcomingRecords,
  createMedicalRecord,
  deleteMedicalRecord,
  fetchWeightLogs,
  addWeightLog,
  // Match & chat
  fetchPetMatchCandidates,
  likePet,
  passPet,
  fetchConversations,
  fetchMessages,
  sendMessage,
  markMessageRead,
  // Storage
  uploadPetPhoto,
  // PetGuardian
  fetchGuardianZones,
  createGuardianZone,
  deleteGuardianZone,
  setGuardianZoneActive,
  fetchLatestGuardianPing,
  recordGuardianPing,
  fetchGuardianAlerts,
  createGuardianAlert,
  acknowledgeGuardianAlert,
  // PetPlanner
  fetchPlannerTasks,
  createPlannerTask,
  setPlannerTaskDone,
  deletePlannerTask,
  // Adopții
  fetchAdoptionListings,
  fetchMyAdoptionListings,
  createAdoptionListing,
  updateAdoptionStatus,
  deleteAdoptionListing,
  applyToAdoption,
  fetchListingApplications,
  fetchMyApplications,
  setApplicationStatus,
  // PetSOS
  fetchSosEvents,
  createSosEvent,
  setPetEmergencyContact,
  // PetEdu
  fetchEduArticles,
  fetchTrainers,
  fetchMyTrainerProfile,
  upsertTrainerProfile,
  setTrainerActive,
  deleteTrainerProfile,
  // PetDay
  fetchPetdayListings,
  fetchMyPetdayListings,
  createPetdayListing,
  updatePetdayListing,
  setPetdayListingActive,
  deletePetdayListing,
  fetchPetdayBookingsAsOwner,
  fetchPetdayBookingsForMyListings,
  createPetdayBooking,
  setPetdayBookingStatus,
  // PetEvents
  fetchEvents,
  fetchMyEvents,
  createEvent,
  updateEvent,
  setEventStatus,
  deleteEvent,
  fetchMyRsvps,
  setEventRsvp,
  fetchEventParticipants,
  // PetMarket
  fetchMarketProducts,
  fetchMyProducts,
  createMarketProduct,
  updateMarketProduct,
  setMarketProductStatus,
  deleteMarketProduct,
  fetchMyOrders,
  fetchSellerOrderItems,
  createMarketOrder,
  setMarketOrderStatus,
  // PetConnect
  fetchForumPosts,
  fetchMyForumPosts,
  createForumPost,
  deleteForumPost,
  fetchPostComments,
  createForumComment,
  deleteForumComment,
  // PetTraining
  fetchTrainingSkills,
  fetchTrainingSessions,
  createTrainingSkill,
  updateTrainingSkill,
  setTrainingSkillStatus,
  deleteTrainingSkill,
  createTrainingSession,
  deleteTrainingSession,
  // PetResQ
  fetchResqCases,
  fetchMyResqCases,
  createResqCase,
  updateResqCase,
  setResqCaseStatus,
  deleteResqCase,
  fetchResqTips,
  createResqTip,
  deleteResqTip,
  // PetInsurance
  fetchInsurancePolicies,
  createInsurancePolicy,
  updateInsurancePolicy,
  setInsurancePolicyStatus,
  deleteInsurancePolicy,
  fetchInsuranceClaims,
  createInsuranceClaim,
  setInsuranceClaimStatus,
  // PetLegacy
  fetchLegacyPlans,
  upsertLegacyPlan,
  deleteLegacyPlan,
  fetchMyMemorials,
  createMemorial,
  updateMemorial,
  deleteMemorial,
};
