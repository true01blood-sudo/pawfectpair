/**
 * Helper pentru alegerea / capturarea imaginilor — galerie sau cameră.
 * Cu respectarea limitelor din spec (5MB, tipuri permise).
 */
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES } from '@pawfectpair/shared';
import { extFromMime } from '@pawfectpair/shared';

export interface PickedImage {
  uri: string;
  mimeType: string;
  size: number;
  ext: string;
}

export class PhotoValidationError extends Error {}

async function validate(uri: string): Promise<PickedImage> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  // FileInfo e un tip union: size există doar când exists === true
  const size = fileInfo.exists && typeof fileInfo.size === 'number' ? fileInfo.size : 0;
  if (size > MAX_PHOTO_SIZE_BYTES) {
    throw new PhotoValidationError(`Fișierul depășește ${MAX_PHOTO_SIZE_BYTES / 1024 / 1024}MB`);
  }
  // Expo nu expune mime direct — deducem din extensie
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime =
    ext === 'png' ? 'image/png' :
    ext === 'webp' ? 'image/webp' :
    ext === 'heic' ? 'image/heic' : 'image/jpeg';
  if (!ALLOWED_PHOTO_TYPES.includes(mime)) {
    throw new PhotoValidationError('Tip fișier nepermis (doar JPEG/PNG/WebP/HEIC)');
  }
  return { uri, mimeType: mime, size, ext: extFromMime(mime) };
}

export async function pickFromGallery(): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') throw new PhotoValidationError('Permisiune galerie refuzată');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  return validate(result.assets[0].uri);
}

export async function takePhoto(): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new PhotoValidationError('Permisiune cameră refuzată');

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  return validate(result.assets[0].uri);
}
