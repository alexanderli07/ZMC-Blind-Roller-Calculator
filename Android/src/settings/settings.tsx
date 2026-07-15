import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  clearSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
  Settings,
} from './settingsStorage';

interface SettingsContextValue {
  settings: Settings;
  ready: boolean;
  saveError: string | null;
  update: (patch: Partial<Settings>) => Promise<boolean>;
  reset: () => Promise<boolean>;
  clearSaveError: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SAVE_ERROR = 'Could not save your settings.';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Held separately so back-to-back updates merge onto the newest values
  // rather than whatever the closure captured.
  const latest = useRef<Settings>(defaultSettings);

  useEffect(() => {
    let active = true;
    loadSettings().then((stored) => {
      if (!active) return;
      latest.current = stored;
      setSettings(stored);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    setSaveError(null);
    const saved = await saveSettings(next);
    if (!saved) setSaveError(SAVE_ERROR);
    return saved;
  }, []);

  const reset = useCallback(async () => {
    latest.current = defaultSettings;
    setSettings(defaultSettings);
    setSaveError(null);
    const cleared = await clearSettings();
    if (!cleared) setSaveError(SAVE_ERROR);
    return cleared;
  }, []);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const value = useMemo(
    () => ({ settings, ready, saveError, update, reset, clearSaveError }),
    [settings, ready, saveError, update, reset, clearSaveError]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used within SettingsProvider');
  return value;
}
