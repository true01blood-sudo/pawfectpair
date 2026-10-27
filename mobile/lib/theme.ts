/**
 * Tema Pet Care Services — aliniată cu designul web (web/src/app/globals.css).
 * Token-uri brand din design-ul userului: primary #FA871B, primary-dark #E0740F,
 * dark #1A1A1A. Light: fundal alb + accente calde; Dark: #1A1A1A precum header-ul web.
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
  fontFamilyRegular: 'System',
  fontFamilyMedium: 'System',
  fontFamilyBold: 'System',
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
    background: '#FFFFFF',          // alb — ca în design-ul web
    surface: '#FFFFFF',
    surfaceAlt: '#FFF6EC',          // tentă caldă pentru inputuri/header
    border: '#E4E4E7',              // zinc-200 — ca în web
    text: '#1A1A1A',                // --dark din globals.css
    textMuted: '#52525B',           // zinc-600
    textInverse: '#FFFFFF',
    primary: '#FA871B',             // --primary din globals.css
    primaryDark: '#E0740F',         // --primary-dark din globals.css
    primaryLight: '#FFE8D1',        // tint 15% al primary-ului
    accent: '#FBBF24',              // amber
    success: '#16A34A',
    warning: '#EAB308',
    danger: '#DC2626',
    like: '#EF4444',
    dislike: '#64748B',
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
    background: '#1A1A1A',          // --dark din globals.css
    surface: '#232323',
    surfaceAlt: '#2C2C2C',
    border: '#3A3A3A',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    textInverse: '#1A1A1A',
    primary: '#FA871B',             // primary rămâne identic pentru brand
    primaryDark: '#E0740F',
    primaryLight: '#7A3E10',
    accent: '#FCD34D',
    success: '#22C55E',
    warning: '#FACC15',
    danger: '#F87171',
    like: '#F87171',
    dislike: '#94A3B8',
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
