/**
 * Tema PetCare — valorile exacte din design system (imagini atașate):
 * Primary Orange #FF6B2D · Charcoal #111827 · Sage #DCE7D6 · Ivory #FFFAF4
 * Font: Plus Jakarta Sans (Light / Regular / Medium / Semibold)
 */

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: {
    // Fundaluri
    background: string;
    surface: string;       // carduri
    surfaceAlt: string;    // header / input bg
    border: string;

    // Text
    text: string;
    textMuted: string;
    textInverse: string;

    // Brand
    primary: string;       // portocaliu
    primaryDark: string;
    primaryLight: string;
    accent: string;        // amber
    success: string;
    warning: string;
    danger: string;

    // PetMatch
    like: string;
    dislike: string;

    // Pet-specii
    speciesDog: string;
    speciesCat: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontFamilyRegular: string;
    fontFamilyMedium: string;
    fontFamilySemibold: string;
    fontFamilyBold: string;
    fontSizeXs: number;
    fontSizeSm: number;
    fontSizeMd: number;
    fontSizeLg: number;
    fontSizeXl: number;
    fontSize2xl: number;
  };
  shadow: {
    sm: object;
    md: object;
    lg: object;
  };
}

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const baseRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

const baseTypography = {
  fontFamilyRegular: 'PlusJakartaSans_400Regular',
  fontFamilyMedium: 'PlusJakartaSans_500Medium',
  fontFamilySemibold: 'PlusJakartaSans_600SemiBold',
  fontFamilyBold: 'PlusJakartaSans_600SemiBold',
  fontSizeXs: 11,
  fontSizeSm: 13,
  fontSizeMd: 15,
  fontSizeLg: 18,
  fontSizeXl: 22,
  fontSize2xl: 28,
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#FFFAF4',          // Ivory — fundal exact din design system
    surface: '#FFFFFF',             // carduri albe
    surfaceAlt: '#F5F5F0',          // suprafațe alternative subtile
    border: '#E5E7EB',              // border gri deschis
    text: '#111827',                // Charcoal exact din design system
    textMuted: '#6B7280',           // gri mediu
    textInverse: '#FFFFFF',
    primary: '#FF6B2D',             // Primary Orange exact din design system
    primaryDark: '#E85A1E',
    primaryLight: '#FFF0E8',        // tint deschis orange
    accent: '#DCE7D6',              // Sage — culoare accent secundară
    success: '#16A34A',
    warning: '#EAB308',
    danger: '#DC2626',
    like: '#FF6B2D',
    dislike: '#6B7280',
    speciesDog: '#D97706',
    speciesCat: '#7C3AED',
  },
  spacing: baseSpacing,
  radius: baseRadius,
  typography: baseTypography,
  shadow: {
    sm: { shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
    lg: { shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 6 },
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#111827',          // Charcoal dark — din design system
    surface: '#1F2937',
    surfaceAlt: '#374151',
    border: '#374151',
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    textInverse: '#111827',
    primary: '#FF6B2D',             // Primary Orange rămâne identic brand
    primaryDark: '#E85A1E',
    primaryLight: '#7A2E10',
    accent: '#3D5A3E',              // Sage dark
    success: '#22C55E',
    warning: '#FACC15',
    danger: '#F87171',
    like: '#FF6B2D',
    dislike: '#9CA3AF',
    speciesDog: '#F59E0B',
    speciesCat: '#A78BFA',
  },
  spacing: baseSpacing,
  radius: baseRadius,
  typography: baseTypography,
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 },
  },
};

/** Culoarea SOS — roșu alertă, ca link-ul "SOS" din header-ul web (text-red-400) */
export const SOS_COLOR = '#F87171';

export function themeFor(mode: ThemeMode): AppTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
