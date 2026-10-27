/**
 * Tipuri pentru modulul PetConnect — comunitatea PawfectPair (forum).
 * Construiește pe tabelele upstream `forum_posts` / `forum_comments` (0001_init).
 */

import type { Profile } from './profile';

/** Categorii de discuții */
export type ConnectCategory =
  | 'general'      // discuții generale
  | 'present'      // prezentări (eu + animalul meu)
  | 'health'       // sănătate
  | 'nutrition'    // nutriție
  | 'training'     // dresaj & comportament
  | 'adoption'     // adopții & salvări
  | 'events'       // evenimente & meetups
  | 'lost_found';  // pierdut/găsit

export const CONNECT_CATEGORIES = [
  'general',
  'present',
  'health',
  'nutrition',
  'training',
  'adoption',
  'events',
  'lost_found',
] as const;

export const CONNECT_CATEGORY_EMOJI: Record<ConnectCategory, string> = {
  general: '💬',
  present: '👋',
  health: '🩺',
  nutrition: '🍖',
  training: '🎓',
  adoption: '🏠',
  events: '🎪',
  lost_found: '🔍',
};

/** Postare pe forum */
export interface ForumPost {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: string | null;     // liber în web; mobilul mapează pe categorii fixe
  created_at: string;
  updated_at: string;
}

export interface ForumPostWithRefs extends ForumPost {
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  comments_count?: number;
}

/** Comentariu */
export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface ForumCommentWithAuthor extends ForumComment {
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

/** Filtre feed */
export interface ConnectFilters {
  category?: ConnectCategory | null;
  search?: string;
}

/** Input postare nouă */
export interface ForumPostInput {
  title: string;
  body: string;
  category: ConnectCategory;
}

/** Input comentariu nou */
export interface ForumCommentInput {
  post_id: string;
  body: string;
}
