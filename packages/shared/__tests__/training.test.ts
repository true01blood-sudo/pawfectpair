/**
 * Teste PetTraining — validare Zod + utils progres/sortare.
 */
import {
  TrainingSkillSchema,
  TrainingSessionSchema,
} from '../src/validation/training';
import {
  TRAINING_STALE_DAYS,
  trainingProgress,
  sortTrainingSkills,
  filterTrainingSkills,
  sortTrainingSessions,
  sessionsInRange,
  trainingDashboard,
  suggestNextDuration,
  searchTrainingSkills,
} from '../src/utils/training';
import type {
  TrainingSession,
  TrainingSkill,
} from '../src/types/training';

const NOW = new Date('2026-06-15T10:00:00Z');

function makeSkill(overrides: Partial<TrainingSkill> = {}): TrainingSkill {
  return {
    id: 's1',
    pet_id: 'p1',
    user_id: 'u1',
    name: 'Șezi',
    category: 'basic',
    difficulty: 1,
    target_sessions: 10,
    status: 'learning',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

function makeSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 't1',
    skill_id: 's1',
    pet_id: 'p1',
    user_id: 'u1',
    duration_minutes: 10,
    rating: 4,
    notes: null,
    practiced_at: '2026-06-10T09:00:00Z',
    created_at: '2026-06-10T09:00:00Z',
    ...overrides,
  };
}

describe('TrainingSkillSchema', () => {
  const valid = {
    pet_id: '11111111-1111-1111-1111-111111111111',
    name: 'Vino la chemare',
    category: 'obedience',
    difficulty: 3,
    target_sessions: 12,
  };

  it('acceptă o abilitate validă', () => {
    expect(TrainingSkillSchema.safeParse(valid).success).toBe(true);
  });

  it('respunde nume prea scurt', () => {
    expect(TrainingSkillSchema.safeParse({ ...valid, name: 'a' }).success).toBe(false);
  });

  it('respunde nume gol după trim', () => {
    expect(TrainingSkillSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });

  it('respunde categorie necunoscută', () => {
    expect(
      TrainingSkillSchema.safeParse({ ...valid, category: 'yoga' }).success
    ).toBe(false);
  });

  it('respunde dificultate 0 și 6', () => {
    expect(TrainingSkillSchema.safeParse({ ...valid, difficulty: 0 }).success).toBe(false);
    expect(TrainingSkillSchema.safeParse({ ...valid, difficulty: 6 }).success).toBe(false);
  });

  it('respunde țintă 0 sesiuni', () => {
    expect(TrainingSkillSchema.safeParse({ ...valid, target_sessions: 0 }).success).toBe(false);
  });

  it('respunde pet_id invalid', () => {
    expect(TrainingSkillSchema.safeParse({ ...valid, pet_id: 'abc' }).success).toBe(false);
  });
});

describe('TrainingSessionSchema', () => {
  const valid = {
    skill_id: '22222222-2222-2222-2222-222222222222',
    duration_minutes: 15,
    rating: 5,
  };

  it('acceptă o sesiune validă', () => {
    const r = TrainingSessionSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('transformă notele goale în null', () => {
    const r = TrainingSessionSchema.safeParse({ ...valid, notes: '  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBeNull();
  });

  it('respunde durata 0 și 181', () => {
    expect(TrainingSessionSchema.safeParse({ ...valid, duration_minutes: 0 }).success).toBe(false);
    expect(TrainingSessionSchema.safeParse({ ...valid, duration_minutes: 181 }).success).toBe(false);
  });

  it('respunde rating 0 și 6', () => {
    expect(TrainingSessionSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
    expect(TrainingSessionSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it('respunde dată practică invalidă', () => {
    expect(
      TrainingSessionSchema.safeParse({ ...valid, practiced_at: 'ieri' }).success
    ).toBe(false);
  });

  it('acceptă dată practică ISO validă', () => {
    const r = TrainingSessionSchema.safeParse({
      ...valid,
      practiced_at: '2026-06-15T08:30:00Z',
    });
    expect(r.success).toBe(true);
  });
});

describe('trainingProgress', () => {
  it('calculează procentul simplu', () => {
    const skill = makeSkill({ target_sessions: 10 });
    const sessions = [makeSession(), makeSession(), makeSession()];
    const p = trainingProgress(skill, sessions, NOW);
    expect(p.sessionsCount).toBe(3);
    expect(p.percent).toBe(30);
    expect(p.totalMinutes).toBe(30);
  });

  it('plafonează procentul la 100', () => {
    const skill = makeSkill({ target_sessions: 2 });
    const sessions = [makeSession(), makeSession(), makeSession(), makeSession()];
    expect(trainingProgress(skill, sessions, NOW).percent).toBe(100);
  });

  it('media rating-ului e rotunjită la o zecimală', () => {
    const sessions = [
      makeSession({ rating: 4 }),
      makeSession({ rating: 5 }),
      makeSession({ rating: 5 }),
    ];
    expect(trainingProgress(makeSkill(), sessions, NOW).avgRating).toBe(4.7);
  });

  it('0 sesiuni → rating 0, daysSince null, nu stale', () => {
    const p = trainingProgress(makeSkill(), [], NOW);
    expect(p.avgRating).toBe(0);
    expect(p.daysSinceLast).toBeNull();
    expect(p.stale).toBe(false);
  });

  it('ultima sesiune veche de 14+ zile → stale', () => {
    const sessions = [makeSession({ practiced_at: '2026-06-01T00:00:00Z' })];
    const p = trainingProgress(makeSkill(), sessions, NOW);
    expect(p.daysSinceLast).toBeGreaterThanOrEqual(TRAINING_STALE_DAYS);
    expect(p.stale).toBe(true);
  });

  it('sesiune recentă → nu stale', () => {
    const sessions = [makeSession({ practiced_at: '2026-06-14T00:00:00Z' })];
    expect(trainingProgress(makeSkill(), sessions, NOW).stale).toBe(false);
  });

  it('alege ultima sesiune corect din listă neordonată', () => {
    const sessions = [
      makeSession({ practiced_at: '2026-06-01T00:00:00Z' }),
      makeSession({ practiced_at: '2026-06-12T00:00:00Z' }),
      makeSession({ practiced_at: '2026-06-08T00:00:00Z' }),
    ];
    expect(trainingProgress(makeSkill(), sessions, NOW).lastPracticedAt).toBe(
      '2026-06-12T00:00:00Z'
    );
  });
});

describe('sortTrainingSkills', () => {
  it('learning → paused → mastered', () => {
    const skills = [
      makeSkill({ id: 'm', status: 'mastered' }),
      makeSkill({ id: 'p', status: 'paused' }),
      makeSkill({ id: 'l', status: 'learning' }),
    ];
    const sorted = sortTrainingSkills(skills, []);
    expect(sorted.map((s) => s.id)).toEqual(['l', 'p', 'm']);
  });

  it('în cadrul learning, progres mai mare primul', () => {
    const skills = [
      makeSkill({ id: 'mic', target_sessions: 10 }),
      makeSkill({ id: 'mare', target_sessions: 4 }),
    ];
    const sessions = [
      makeSession({ skill_id: 'mare' }),
      makeSession({ skill_id: 'mare' }),
    ]; // 2/4 = 50%
    const sorted = sortTrainingSkills(skills, sessions);
    expect(sorted[0].id).toBe('mare');
  });
});

describe('filterTrainingSkills', () => {
  const skills = [
    makeSkill({ id: 'a', pet_id: 'p1', category: 'basic', status: 'learning' }),
    makeSkill({ id: 'b', pet_id: 'p2', category: 'tricks', status: 'learning' }),
    makeSkill({ id: 'c', pet_id: 'p1', category: 'basic', status: 'mastered' }),
  ];

  it('filtează după animal', () => {
    const r = filterTrainingSkills(skills, { petId: 'p1', includeMastered: true });
    expect(r.map((s) => s.id).sort()).toEqual(['a', 'c']);
  });

  it('exclude mastered implicit', () => {
    const r = filterTrainingSkills(skills, { petId: 'p1' });
    expect(r.map((s) => s.id)).toEqual(['a']);
  });

  it('include mastered la cerere', () => {
    const r = filterTrainingSkills(skills, { includeMastered: true });
    expect(r.length).toBe(3);
  });

  it('filtează după categorie', () => {
    const r = filterTrainingSkills(skills, { category: 'tricks', includeMastered: true });
    expect(r.map((s) => s.id)).toEqual(['b']);
  });
});

describe('sortTrainingSessions + sessionsInRange', () => {
  it('sortează descrescător după practiced_at', () => {
    const sessions = [
      makeSession({ id: 'old', practiced_at: '2026-06-01T00:00:00Z' }),
      makeSession({ id: 'new', practiced_at: '2026-06-14T00:00:00Z' }),
      makeSession({ id: 'mid', practiced_at: '2026-06-07T00:00:00Z' }),
    ];
    expect(sortTrainingSessions(sessions).map((s) => s.id)).toEqual([
      'new',
      'mid',
      'old',
    ]);
  });

  it('doar sesiunile din ultimele 7 zile', () => {
    const sessions = [
      makeSession({ id: 'v', practiced_at: '2026-06-07T09:59:00Z' }),
      makeSession({ id: 'x', practiced_at: '2026-06-08T10:01:00Z' }),
      makeSession({ id: 'y', practiced_at: '2026-06-15T10:00:00Z' }),
    ];
    const r = sessionsInRange(sessions, 7, NOW);
    expect(r.map((s) => s.id).sort()).toEqual(['x', 'y']);
  });
});

describe('trainingDashboard', () => {
  it('agreghează corect', () => {
    const skills = [
      makeSkill({ status: 'learning' }),
      makeSkill({ id: 's2', status: 'mastered' }),
      makeSkill({ id: 's3', status: 'paused' }),
    ];
    const sessions = [
      makeSession({ duration_minutes: 15, rating: 4 }),
      makeSession({ duration_minutes: 25, rating: 5 }),
      makeSession({ duration_minutes: 10, rating: 3, practiced_at: '2026-05-01T00:00:00Z' }),
    ];
    const d = trainingDashboard(skills, sessions, NOW);
    expect(d.totalSessions).toBe(3);
    expect(d.totalMinutes).toBe(50);
    expect(d.learningCount).toBe(1);
    expect(d.masteredCount).toBe(1);
    expect(d.pausedCount).toBe(1);
    expect(d.sessionsThisWeek).toBe(2);
    expect(d.avgRating).toBe(4);
  });
});

describe('suggestNextDuration', () => {
  it('fallback fără sesiuni', () => {
    expect(suggestNextDuration([])).toBe(10);
  });

  it('media ultimelor 5 sesiuni rotunjită la 5', () => {
    const sessions = [
      makeSession({ duration_minutes: 12, practiced_at: '2026-06-14T00:00:00Z' }),
      makeSession({ duration_minutes: 8, practiced_at: '2026-06-13T00:00:00Z' }),
      makeSession({ duration_minutes: 10, practiced_at: '2026-06-12T00:00:00Z' }),
    ];
    expect(suggestNextDuration(sessions)).toBe(10);
  });

  it('plafon minim 5 minute', () => {
    const sessions = [makeSession({ duration_minutes: 1 })];
    expect(suggestNextDuration(sessions)).toBe(5);
  });
});

describe('searchTrainingSkills', () => {
  it('căutare diacritice-insensibilă', () => {
    const skills = [makeSkill({ name: 'Mers în lesă' }), makeSkill({ id: 's2', name: 'Roată' })];
    expect(searchTrainingSkills(skills, 'lesa').length).toBe(1);
    expect(searchTrainingSkills(skills, 'LEȘĂ')[0].id).toBe('s1');
  });

  it('căutare goală → totul', () => {
    expect(searchTrainingSkills([makeSkill()], '  ').length).toBe(1);
  });
});
