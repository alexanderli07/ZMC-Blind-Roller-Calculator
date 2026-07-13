import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from './theme';

export const THEME_PREFERENCE_KEY = 'appearance_preference';

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<boolean> {
  try {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
    return true;
  } catch {
    return false;
  }
}
