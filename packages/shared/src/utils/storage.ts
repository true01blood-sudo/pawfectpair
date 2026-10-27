/**
 * Helpers pentru generare path-uri în Supabase Storage.
 */
import { STORAGE_BUCKET } from '../constants/app';

/** Path pentru poză animal: {user_id}/{uuid}.{ext} */
export function petPhotoPath(userId: string, ext: string = 'jpg'): string {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${userId}/${uuid}.${ext}`;
}

/** URL public complet pentru un obiect din Storage */
export function publicStorageUrl(
  supabaseUrl: string,
  path: string,
  bucket: string = STORAGE_BUCKET
): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Extrag extensie din mime type */
export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
  };
  return map[mime.toLowerCase()] ?? 'jpg';
}
