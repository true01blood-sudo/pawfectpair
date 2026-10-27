/**
 * Utils PetEdu — funcții pure pentru filtrare articole & traineri.
 * Testate unitar în packages/shared/__tests__/edu.test.ts.
 */
import type { EduArticle, EduFilters, EduSpecies, Trainer, TrainerFilters, TrainerSpecialty } from '../types/edu';

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

/** Filtrare articole după specie, categorie și text (titlu + corp). */
export function filterEduArticles(
  articles: EduArticle[],
  filters: EduFilters
): EduArticle[] {
  const search = filters.search ? normalize(filters.search) : null;
  return articles.filter((a) => {
    if (filters.species && a.species !== filters.species) return false;
    if (filters.category && a.category !== filters.category) return false;
    if (search) {
      const haystack = normalize(`${a.title} ${a.body}`);
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Categorii unice existente în lista de articole (în ordinea apariției). */
export function eduArticleCategories(articles: EduArticle[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of articles) {
    if (a.category && !seen.has(a.category)) {
      seen.add(a.category);
      out.push(a.category);
    }
  }
  return out;
}

/** Sortare articole: specie „general" primul, apoi cronologic descrescător. */
export function sortEduArticles(articles: EduArticle[]): EduArticle[] {
  return [...articles].sort((a, b) => {
    if (a.species === 'general' && b.species !== 'general') return -1;
    if (a.species !== 'general' && b.species === 'general') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Filtrare traineri după specializare, oraș și text (nume + bio). */
export function filterTrainers(
  trainers: Trainer[],
  filters: TrainerFilters
): Trainer[] {
  const search = filters.search ? normalize(filters.search) : null;
  return trainers.filter((t) => {
    if (!t.active) return false;
    if (filters.specialty && !t.specialties.includes(filters.specialty)) return false;
    if (filters.city && filters.city.trim()) {
      if (!t.city || normalize(t.city) !== normalize(filters.city.trim())) return false;
    }
    if (search) {
      const haystack = normalize(
        `${t.display_name} ${t.bio ?? ''} ${t.city ?? ''}`
      );
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/**
 * Sortare traineri: verificați primul, apoi cu mai multă experiență,
 * apoi cele mai recente profiluri.
 */
export function sortTrainers(trainers: Trainer[]): Trainer[] {
  return [...trainers].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.experience_years !== b.experience_years) {
      return b.experience_years - a.experience_years;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Rezumat bio: trunchiază la n caractere fără a tăia cuvinte. */
export function bioExcerpt(bio: string | null, max = 120): string | null {
  if (!bio) return null;
  if (bio.length <= max) return bio;
  const cut = bio.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/** Cheie i18n pentru specie sau fallback „general". */
export function eduSpeciesKey(species: string): EduSpecies {
  return (['general', 'caine', 'pisica', 'altele'] as EduSpecies[]).includes(
    species as EduSpecies
  )
    ? (species as EduSpecies)
    : 'general';
}

/** Verifică dacă lista de specialități conține una dată (type-safe). */
export function hasSpecialty(
  specialties: string[],
  specialty: TrainerSpecialty
): boolean {
  return specialties.includes(specialty);
}
