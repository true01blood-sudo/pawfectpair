/**
 * Utilitare de securitate — sanitizare input, validare URL, protecție XSS/injection.
 * Folosite înainte de orice insert/update în Supabase și la randarea conținutului.
 *
 * Note despre modelul de amenințări:
 * - SQL Injection: Supabase PostgREST folosește interogări parametrizate → riscul principal
 *   e la nivelul valorilor malformate; sanitizăm oricum pentru defensiv în profunzime.
 * - XSS: React Native nu execută HTML raw, dar conținutul poate ajunge în WebView-uri,
 *   notificări, share links → validăm orice URL/HTML afișat.
 * - Path traversal: la upload Storage, validăm structura path-ului.
 */

/** Curăță un string de caractere de control și null bytes */
export function sanitizeText(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return '';
  return input
    // elimină null bytes și caractere de control (păstrăm \n \t)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Escapează caractere HTML periculoase (defensiv; RN nu randează HTML raw) */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Scheme de URL permise în aplicație (whitelist — conform spec secțiunea 8.5) */
export const ALLOWED_URL_SCHEMES = ['https', 'mailto', 'tel', 'pawfectpair', 'petcare'] as const;

/**
 * Validează un URL: doar scheme din whitelist, fără javascript:, data:, file:.
 * Returnează URL-ul curat sau null dacă e invalid/periculos.
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // blochează explicit scheme periculoase chiar dacă ar trebui prinse de parser
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('about:')
  ) {
    return null;
  }

  try {
    // URL-urile relative (ex: /storage/...) nu sunt permise aici — trebuie absolute
    const url = new URL(trimmed);
    const scheme = url.protocol.replace(':', '').toLowerCase();
    if (!ALLOWED_URL_SCHEMES.includes(scheme as (typeof ALLOWED_URL_SCHEMES)[number])) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Validează un path de Storage: {user_id}/{uuid}.{ext}
 * Previne path traversal (../../) și caractere nepermise.
 */
export function validateStoragePath(path: string, expectedUserId: string): boolean {
  if (!path || typeof path !== 'string') return false;
  // trebuie să înceapă cu user_id corect
  if (!path.startsWith(`${expectedUserId}/`)) return false;
  // fără path traversal
  if (path.includes('..') || path.includes('\\')) return false;
  // doar caractere sigure
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(path)) return false;
  // nu mai mult de 3 niveluri
  if (path.split('/').length > 3) return false;
  return true;
}

/** Validează un UUID v4 (protecție împotriva ID-urilor malformate) */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUuid(id: string | null | undefined): boolean {
  return !!id && UUID_RE.test(id);
}

/** Validează un email cu regex robust (RFC-lite) */
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

/** Validează un număr de telefon internațional/EU */
const PHONE_RE = /^\+?[0-9]{10,15}$/;
export function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone.replace(/[\s\-().]/g, ''));
}

/**
 * Sanitizează conținutul unui mesaj de chat.
 * Elimină caractere de control, limitează lungimea, curăță zero-width chars
 * (folosite pentru spam/Cyrillic homoglyph tricks).
 */
export function sanitizeMessage(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeText(input, 2000)
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/\s{4,}/g, '   ');             // spam whitespace
}

/** Verifică dacă un string conține caractere homoglyph suspecte (anti-spoofing) */
export function containsSuspiciousUnicode(input: string): boolean {
  // Cuvinte = secvențe continue de litere din ORICE alfabet (\p{L} cu flag 'u').
  // Bug vechi: caracterele chirilice erau EXCLUSE din cuvânt înainte de test —
  // exact opusul intenției. Acum: suspect = cuvânt cu litere latin + chirilic/grec amestecate.
  let words: string[] = [];
  try {
    words = input.match(/[\p{L}]+/gu) ?? [];
  } catch {
    // fallback pentru runtime-uri fără suport \p{L}: cuvinte pe litere ASCII+extinse
    words = input.match(/[a-zA-Z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]+/g) ?? [];
  }
  const nonLatin = /[\u0370-\u03FF\u0400-\u04FF]/;
  const latin = /[a-zA-Z\u00C0-\u024F]/;
  return words.some((w) => latin.test(w) && nonLatin.test(w));
}

/** Rate limiter simplu in-memory (per instanță; server-side e în Supabase) */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}

  /** Returnează true dacă acțiunea e permisă */
  allow(key: string): boolean {
    const now = Date.now();
    const window = (this.attempts.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (window.length >= this.maxAttempts) {
      this.attempts.set(key, window);
      return false;
    }
    window.push(now);
    this.attempts.set(key, window);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Verifică puterea unei parole (score 0-4).
 * 0 = foarte slabă, 4 = foarte puternică.
 */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  // parole comune — penalizare
  const common = ['password', '12345678', 'qwerty', 'parola123', 'letmein'];
  if (common.some((c) => password.toLowerCase().includes(c))) score = Math.min(score, 1);
  return Math.min(score, 4);
}

/** Generează un ID de sesiune criptografic sigur (pentru device fingerprint lite) */
export function generateSecureId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // fallback deterministic (doar în medii fără crypto — test)
    for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
