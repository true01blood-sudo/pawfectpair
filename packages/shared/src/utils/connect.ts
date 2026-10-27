/**
 * Utils PetConnect — funcții pure pentru filtrare/sortare postări forum.
 * Testate unitar în packages/shared/__tests__/connect.test.ts.
 */
import type { ConnectCategory, ConnectFilters, ForumPostWithRefs } from '../types/connect';
import { CONNECT_CATEGORIES } from '../types/connect';

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

/** Mapază o categorie liberă (web/DB) pe o categorie cunoscută; fallback 'general'. */
export function connectCategoryKey(category: string | null | undefined): ConnectCategory {
  if (!category) return 'general';
  const norm = normalize(category);
  const direct = CONNECT_CATEGORIES.find((c) => c === norm);
  if (direct) return direct;
  const alias: Record<string, ConnectCategory> = {
    discutii: 'general',
    prezentare: 'present',
    prezentari: 'present',
    sanatate: 'health',
    nutritie: 'nutrition',
    hrana: 'nutrition',
    dresaj: 'training',
    comportament: 'training',
    adoptie: 'adoption',
    adoptii: 'adoption',
    evenimente: 'events',
    pierdut: 'lost_found',
    gasit: 'lost_found',
  };
  return alias[norm] ?? 'general';
}

/** Filtrare postări: categorie + text (titlu + corp). */
export function filterPosts(
  posts: ForumPostWithRefs[],
  filters: ConnectFilters
): ForumPostWithRefs[] {
  const search = filters.search ? normalize(filters.search) : null;
  return posts.filter((p) => {
    if (filters.category && connectCategoryKey(p.category) !== filters.category) return false;
    if (search) {
      const haystack = normalize(`${p.title} ${p.body}`);
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Sortare: cele mai recente primele (updated_at, apoi created_at). */
export function sortPosts(posts: ForumPostWithRefs[]): ForumPostWithRefs[] {
  return [...posts].sort((a, b) => {
    const ta = new Date(a.updated_at || a.created_at).getTime();
    const tb = new Date(b.updated_at || b.created_at).getTime();
    return tb - ta;
  });
}

/** Excerpt fără tăiere în mijlocul cuvintelor. */
export function postExcerpt(body: string | null, max = 160): string | null {
  if (!body) return null;
  const clean = body.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + '…';
}
