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
  primary: '#007AFF',
  onPrimary: '#FFFFFF',
  danger: '#C0392B',
  dangerSurface: '#FDF2F2',
  dangerBorder: '#E3B1B1',
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
  primary: '#5CADFF',
  onPrimary: '#07131F',
  danger: '#FF8A80',
  dangerSurface: '#3B2022',
  dangerBorder: '#754044',
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
