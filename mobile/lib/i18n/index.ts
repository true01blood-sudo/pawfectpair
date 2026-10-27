/**
 * Configurare i18next + expo-localization.
 * Suportă 7 limbi: RO (implicit), EN, FR, DE, IT, ES, PT.
 * Detectare automată pe baza regiunii dispozitivului (expo-localization).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ro } from './locales/ro';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { it } from './locales/it';
import { es } from './locales/es';
import { pt } from './locales/pt';

export type AppLanguage = 'ro' | 'en' | 'fr' | 'de' | 'it' | 'es' | 'pt';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['ro', 'en', 'fr', 'de', 'it', 'es', 'pt'];

export const LANGUAGE_LABELS: Record<AppLanguage, { native: string; flag: string; region: string }> = {
  ro: { native: 'Română', flag: '🇷🇴', region: 'România' },
  en: { native: 'English', flag: '🇬🇧', region: 'United Kingdom / SUA' },
  fr: { native: 'Français', flag: '🇫🇷', region: 'France' },
  de: { native: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  it: { native: 'Italiano', flag: '🇮🇹', region: 'Italia' },
  es: { native: 'Español', flag: '🇪🇸', region: 'España' },
  pt: { native: 'Português', flag: '🇵🇹', region: 'Brasil / Portugal' },
};

const STORAGE_KEY = 'pawfectpair_language';

/** Detectează limba implicită pe baza regiunii dispozitivului */
export function detectDeviceLanguage(): AppLanguage {
  try {
    const locales = getLocales() ?? [];
    const first = locales[0];
    if (first?.languageCode) {
      const code = first.languageCode.toLowerCase() as AppLanguage;
      if (SUPPORTED_LANGUAGES.includes(code)) return code;
    }
  } catch (e) {
    console.warn('[i18n] Detectare limbă eșuată', e);
  }
  return 'ro'; // fallback implicit
}

/** Încarcă limba salvată de utilizator, altfel detectează */
async function loadStoredLanguage(): Promise<AppLanguage> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
      return stored as AppLanguage;
    }
  } catch (e) {
    console.warn('[i18n] Citire limbă salvată eșuată', e);
  }
  return detectDeviceLanguage();
}

/** Schimbă limba și o persistă */
export async function changeLanguage(lang: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.warn('[i18n] Salvare limbă eșuată', e);
  }
}

/** Resetează la detectarea automată */
export async function resetToAutoLanguage(): Promise<AppLanguage> {
  const detected = detectDeviceLanguage();
  await changeLanguage(detected);
  return detected;
}

// Inițializare sincronă cu limba detectată (pentru a nu bloca prima randare)
const initialLang = detectDeviceLanguage();

i18n.use(initReactI18next).init({
  resources: {
    ro: { translation: ro },
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    es: { translation: es },
    pt: { translation: pt },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnNull: false,
});

// Apoi încercăm să încărcăm limba salvată (override)
loadStoredLanguage().then((lang) => {
  if (lang !== initialLang) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;
