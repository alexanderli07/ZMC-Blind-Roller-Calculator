import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { loadThemePreference, saveThemePreference } from './themeStorage';
import { ZMC_RED, ZMC_RED_ON_DARK } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  divider: string;
  primary: string;
  onPrimary: string;
  danger: string;
  dangerSurface: string;
  dangerBorder: string;
  success: string;
  successSurface: string;
  successBorder: string;
  overlay: string;
  shadow: string;
}

export const lightPalette: ThemeColors = {
  background: '#EEF2F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#E5E9EC',
  text: '#1A1D21',
  textMuted: '#55606A',
  textSubtle: '#8A939C',
  border: '#D0D5DA',
  divider: '#ECEFF2',
  primary: ZMC_RED,
  onPrimary: '#FFFFFF',
  // Deliberately darker and browner than the brand crimson so an over-limit
  // reading never reads as just another branded accent.
  danger: '#8E1F14',
  dangerSurface: '#FBEAE7',
  dangerBorder: '#E0A99F',
  success: '#2F6B14',
  successSurface: '#EAF3DE',
  successBorder: '#B7D593',
  overlay: 'rgba(0,0,0,0.40)',
  shadow: '#000000',
};

export const darkPalette: ThemeColors = {
  background: '#101418',
  surface: '#1B2127',
  surfaceSecondary: '#2A323A',
  text: '#F4F7F9',
  textMuted: '#B6C0C9',
  textSubtle: '#8F9AA5',
  border: '#3A454F',
  divider: '#303A43',
  primary: ZMC_RED_ON_DARK,
  onPrimary: '#2C0710',
  danger: '#FFA79B',
  dangerSurface: '#3B1E1A',
  dangerBorder: '#7A4238',
  success: '#A8D46A',
  successSurface: '#1E2A12',
  successBorder: '#41611F',
  overlay: 'rgba(0,0,0,0.70)',
  shadow: '#000000',
};

export function resolveTheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  saveError: string | null;
  setPreference: (preference: ThemePreference) => Promise<boolean>;
  clearSaveError: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadThemePreference().then((stored) => {
      if (active) setPreferenceState(stored);
    });
    return () => { active = false; };
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    setSaveError(null);
    const saved = await saveThemePreference(next);
    if (!saved) setSaveError('Could not save appearance preference.');
    return saved;
  }, []);

  const clearSaveError = useCallback(() => setSaveError(null), []);
  const resolvedTheme = resolveTheme(preference, systemScheme);
  const colors = resolvedTheme === 'dark' ? darkPalette : lightPalette;
  const value = useMemo(() => ({
    preference,
    resolvedTheme,
    colors,
    saveError,
    setPreference,
    clearSaveError,
  }), [preference, resolvedTheme, colors, saveError, setPreference, clearSaveError]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
