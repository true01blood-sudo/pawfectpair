/**
 * Tipuri pentru modulul PetTraining — dresaj & stimulare cognitivă:
 * utilizatorul definește abilități/comezi per animal, notează sesiuni de
 * antrenament (durată, rating, note) și urmărește progresul până la stăpânire.
 */

/** Categorie de abilitate antrenată */
export type TrainingCategory =
  | 'basic'      // comeze de bază (șezi, vino, stai)
  | 'obedience'  // ascultare avansată / lesă
  | 'tricks'     // trucuri (dă laba, roată)
  | 'agility'    // parcurs / sport canine
  | 'behavior'   // modificare comportament (anxietate, mușcat)
  | 'cognitive'; // stimulare mentală (puzzle, nosework)

export const TRAINING_CATEGORIES = [
  'basic',
  'obedience',
  'tricks',
  'agility',
  'behavior',
  'cognitive',
] as const;

export const TRAINING_CATEGORY_EMOJI: Record<TrainingCategory, string> = {
  basic: '🦴',
  obedience: '🎖️',
  tricks: '🎭',
  agility: '🏃',
  behavior: '🧠',
  cognitive: '🧩',
};

/** Status abilitate */
export type TrainingSkillStatus = 'learning' | 'paused' | 'mastered';

export const TRAINING_SKILL_STATUSES = [
  'learning',
  'paused',
  'mastered',
] as const;

/** Abilitate (comandă/truc) per animal */
export interface TrainingSkill {
  id: string;
  pet_id: string;
  user_id: string;
  name: string;
  category: TrainingCategory;
  /** Dificultate percepută 1-5 */
  difficulty: number;
  /** Câte sesiuni țintește utilizatorul pentru stăpânire */
  target_sessions: number;
  status: TrainingSkillStatus;
  created_at: string;
  updated_at: string;
}

/** Sesiune de antrenament pe o abilitate */
export interface TrainingSession {
  id: string;
  skill_id: string;
  pet_id: string | null;
  user_id: string;
  /** Durata în minute (1-180) */
  duration_minutes: number;
  /** Cum a mers: 1-5 (5 = excelent) */
  rating: number;
  notes: string | null;
  practiced_at: string; // ISO datetime
  created_at: string;
}

/** Sesiune cu numele abilității (pentru lista „sesiuni recente") */
export interface TrainingSessionWithSkill extends TrainingSession {
  skill?: Pick<TrainingSkill, 'id' | 'name' | 'category'> | null;
}

/** Progres calculat pentru o abilitate */
export interface TrainingSkillProgress {
  sessionsCount: number;
  targetSessions: number;
  /** 0-100, plafonat la 100 */
  percent: number;
  /** minute totale antrenate pe abilitate */
  totalMinutes: number;
  /** rating mediu 0-5 (0 dacă nicio sesiune) */
  avgRating: number;
  /** ISO data ultimei sesiuni sau null */
  lastPracticedAt: string | null;
  /** zile de la ultima sesiune (null dacă nicio sesiune) */
  daysSinceLast: number | null;
  /** abilitate nepracticată de ≥ 14 zile */
  stale: boolean;
}

/** Filtre listă abilități */
export interface TrainingFilters {
  petId?: string | null;
  category?: TrainingCategory | null;
  includeMastered?: boolean;
}

/** Input creare/editare abilitate */
export interface TrainingSkillInput {
  pet_id: string;
  name: string;
  category: TrainingCategory;
  difficulty: number;
  target_sessions: number;
}

/** Input sesiune nouă */
export interface TrainingSessionInput {
  skill_id: string;
  duration_minutes: number;
  rating: number;
  notes?: string | null;
  practiced_at?: string;
}

/** Sumar ecran (dashboard) */
export interface TrainingDashboard {
  totalSessions: number;
  totalMinutes: number;
  learningCount: number;
  masteredCount: number;
  pausedCount: number;
  /** sesiuni în ultimele 7 zile */
  sessionsThisWeek: number;
  avgRating: number;
}
