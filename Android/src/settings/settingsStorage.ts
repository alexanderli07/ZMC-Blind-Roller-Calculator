// Persistence for user preferences, following the same shape as themeStorage:
// every read is defensive, and every write reports whether it landed.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_DEFLECTION_IN } from '../calculations';
import type { UnitSystem } from '../format';

export const SETTINGS_KEY = 'app_settings_v1';
export const SELECTION_KEY = 'last_selection_v1';

export interface Settings {
  units: UnitSystem;
  showSecondaryUnit: boolean;
  weightDecimals: number;
  diameterDecimals: number;
  deflectionDecimals: number;
  maxDeflectionIn: number;
  rememberSelections: boolean;
}

export const MIN_DECIMALS = 0;
// Deflection lands around 0.008 in on short blinds, so leave real headroom.
export const MAX_DECIMALS = 6;

export const defaultSettings: Settings = {
  units: 'imperial',
  showSecondaryUnit: true,
  // Weight to three places was false precision; deflection genuinely needs it.
  weightDecimals: 2,
  diameterDecimals: 2,
  deflectionDecimals: 3,
  maxDeflectionIn: MAX_DEFLECTION_IN,
  rememberSelections: true,
};

export interface Selection {
  tube: string;
  fabric: string;
  bottomBar: string;
}

export const emptySelection: Selection = { tube: '', fabric: '', bottomBar: '' };

function clampDecimals(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(MAX_DECIMALS, Math.max(MIN_DECIMALS, Math.round(value)));
}

function boolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function name(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return defaultSettings;
  const value = raw as Record<string, unknown>;
  const limit = value.maxDeflectionIn;

  return {
    units: value.units === 'metric' ? 'metric' : 'imperial',
    showSecondaryUnit: boolean(value.showSecondaryUnit, defaultSettings.showSecondaryUnit),
    weightDecimals: clampDecimals(value.weightDecimals, defaultSettings.weightDecimals),
    diameterDecimals: clampDecimals(value.diameterDecimals, defaultSettings.diameterDecimals),
    deflectionDecimals: clampDecimals(value.deflectionDecimals, defaultSettings.deflectionDecimals),
    maxDeflectionIn:
      typeof limit === 'number' && Number.isFinite(limit) && limit > 0
        ? limit
        : defaultSettings.maxDeflectionIn,
    rememberSelections: boolean(value.rememberSelections, defaultSettings.rememberSelections),
  };
}

export function normalizeSelection(raw: unknown): Selection {
  if (typeof raw !== 'object' || raw === null) return emptySelection;
  const value = raw as Record<string, unknown>;
  return {
    tube: name(value.tube),
    fabric: name(value.fabric),
    bottomBar: name(value.bottomBar),
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export async function clearSettings(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function loadSelection(): Promise<Selection> {
  try {
    const raw = await AsyncStorage.getItem(SELECTION_KEY);
    return raw ? normalizeSelection(JSON.parse(raw)) : emptySelection;
  } catch {
    return emptySelection;
  }
}

// Best-effort: a dropped selection memory is not worth an error banner.
export async function saveSelection(selection: Selection): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
  } catch {
    // ignored
  }
}

export async function clearSelection(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SELECTION_KEY);
  } catch {
    // ignored
  }
}
