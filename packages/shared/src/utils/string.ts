/**
 * Inițiale pentru avatar fallback (ex: „Andrei Popa" -> „AP")
 */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Trunchiază un text la N caractere cu ellipsis.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Validează dacă un string este un UUID v4.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

/**
 * Slugify robust: mapează explicit diacriticele românești cu virgulă dedesubt
 * (ș ț Ș Ț — FĂRĂ decompoziție NFD canonică!), apoi elimină restul accentelor.
 * Astfel rezultatul e identic indiferent dacă input-ul e NFC sau NFD.
 */
export function slugify(input: string): string {
  return input
    // mapație explicită pentru literele românești fără decompoziție NFD
    .replace(/[șş]/g, 's')
    .replace(/[ȘŞ]/g, 'S')
    .replace(/[țţ]/g, 't')
    .replace(/[ȚŢ]/g, 'T')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
