/**
 * Utils PetTraining — funcții pure pentru progres, sortare și statistici.
 * Testate unitar în packages/shared/__tests__/training.test.ts.
 */
import type {
  TrainingDashboard,
  TrainingFilters,
  TrainingSession,
  TrainingSkill,
  TrainingSkillProgress,
  TrainingSkillStatus,
} from '../types/training';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Prag „abilitate uitată": nu s-a practicat de cel puțin 14 zile */
export const TRAINING_STALE_DAYS = 14;

/** Normalizează text pentru căutare diacritice-insensibilă (RO). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .trim();
}

/** Sesiunile aparținând unei abilități. */
export function sessionsForSkill(
  sessions: TrainingSession[],
  skillId: string
): TrainingSession[] {
  return sessions.filter((s) => s.skill_id === skillId);
}

/**
 * Progres spre stăpânire: sesiuni făcute / țintă (plafon 100%),
 * minute totale, rating mediu, ultima practică + semnal „uitat".
 */
export function trainingProgress(
  skill: Pick<TrainingSkill, 'id' | 'target_sessions'>,
  sessions: TrainingSession[],
  now: Date = new Date()
): TrainingSkillProgress {
  const mine = sessionsForSkill(sessions, skill.id);
  const count = mine.length;
  const target = Math.max(1, skill.target_sessions);
  const percent = Math.min(100, Math.round((count / target) * 100));
  const totalMinutes = mine.reduce((sum, s) => sum + s.duration_minutes, 0);
  const avgRating =
    count === 0
      ? 0
      : Math.round((mine.reduce((sum, s) => sum + s.rating, 0) / count) * 10) / 10;
  const last = mine.reduce<string | null>((acc, s) => {
    if (!acc || new Date(s.practiced_at).getTime() > new Date(acc).getTime()) {
      return s.practiced_at;
    }
    return acc;
  }, null);
  const daysSinceLast = last
    ? Math.floor((now.getTime() - new Date(last).getTime()) / DAY_MS)
    : null;
  return {
    sessionsCount: count,
    targetSessions: target,
    percent,
    totalMinutes,
    avgRating,
    lastPracticedAt: last,
    daysSinceLast,
    stale: daysSinceLast != null && daysSinceLast >= TRAINING_STALE_DAYS,
  };
}

/**
 * Sortare abilități: învățare primele (progres descrescător), apoi pauză,
 * stăpânite la final (cele mai recent stăpânite primele).
 */
export function sortTrainingSkills(
  skills: TrainingSkill[],
  sessions: TrainingSession[]
): TrainingSkill[] {
  const rank: Record<TrainingSkillStatus, number> = {
    learning: 0,
    paused: 1,
    mastered: 2,
  };
  return [...skills].sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    const pa = trainingProgress(a, sessions);
    const pb = trainingProgress(b, sessions);
    if (a.status === 'mastered') return pb.percent - pa.percent || 0;
    // learning/paused: cele mai aproape de final primele
    return pb.percent - pa.percent;
  });
}

/** Filtrare abilități după animal, categorie și includerea celor stăpânite. */
export function filterTrainingSkills(
  skills: TrainingSkill[],
  filters: TrainingFilters
): TrainingSkill[] {
  const petId = filters.petId ?? null;
  const category = filters.category ?? null;
  return skills.filter((s) => {
    if (petId && s.pet_id !== petId) return false;
    if (category && s.category !== category) return false;
    if (!filters.includeMastered && s.status === 'mastered') return false;
    return true;
  });
}

/**
 * Sortare sesiuni: cele mai recente primele.
 * (listă „sesiuni recente" + istoric pe abilitate)
 */
export function sortTrainingSessions(
  sessions: TrainingSession[]
): TrainingSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.practiced_at).getTime() - new Date(a.practiced_at).getTime()
  );
}

/** Sesiuni din ultimele `days` zile (implicit 7). */
export function sessionsInRange(
  sessions: TrainingSession[],
  days = 7,
  now: Date = new Date()
): TrainingSession[] {
  const from = now.getTime() - days * DAY_MS;
  return sessions.filter((s) => new Date(s.practiced_at).getTime() >= from);
}

/** Sumar dashboard din abilități + sesiuni. */
export function trainingDashboard(
  skills: TrainingSkill[],
  sessions: TrainingSession[],
  now: Date = new Date()
): TrainingDashboard {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const rated = sessions.filter((s) => s.rating > 0);
  const avgRating =
    rated.length === 0
      ? 0
      : Math.round((rated.reduce((sum, s) => sum + s.rating, 0) / rated.length) * 10) / 10;
  return {
    totalSessions: sessions.length,
    totalMinutes,
    learningCount: skills.filter((s) => s.status === 'learning').length,
    masteredCount: skills.filter((s) => s.status === 'mastered').length,
    pausedCount: skills.filter((s) => s.status === 'paused').length,
    sessionsThisWeek: sessionsInRange(sessions, 7, now).length,
    avgRating,
  };
}

/** Sugestie rapidă de durată pentru următoarea sesiune (media ultimelor 5, rotunjită la 5). */
export function suggestNextDuration(
  sessions: TrainingSession[],
  fallback = 10
): number {
  if (sessions.length === 0) return fallback;
  const last5 = sortTrainingSessions(sessions).slice(0, 5);
  const avg =
    last5.reduce((sum, s) => sum + s.duration_minutes, 0) / last5.length;
  return Math.max(5, Math.min(180, Math.round(avg / 5) * 5));
}

/** Căutare text în numele abilităților (diacritice-insensibil). */
export function searchTrainingSkills(
  skills: TrainingSkill[],
  search: string
): TrainingSkill[] {
  const q = normalize(search);
  if (!q) return skills;
  return skills.filter((s) => normalize(s.name).includes(q));
}
