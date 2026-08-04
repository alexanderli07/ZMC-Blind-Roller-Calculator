# System Theme and Appearance Override Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Expo Android app follow the device theme by default while supporting persistent System, Light, and Dark overrides from an accessible settings modal.

**Architecture:** A React context resolves a validated AsyncStorage preference against React Native's live `useColorScheme()` value and exposes semantic palette tokens. Existing controls consume the context directly, while a dedicated Appearance modal owns only interaction state and delegates persistence to the provider.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, AsyncStorage, Jest 29, jest-expo, React Native Testing Library.

## Global Constraints

- A fresh installation defaults to `System`.
- Supported preferences are exactly `system`, `light`, and `dark`.
- Manual choices apply immediately and persist across app restarts.
- System mode responds live to Android appearance changes.
- Invalid or unreadable stored values fall back to `system`.
- A failed save leaves the in-session appearance active, keeps the modal open, and shows an inline error.
- Do not add dependencies or change calculator formulas, datasets, custom-item formats, logo/splash artwork, or `SafeAreaView` usage.
- Use the exact semantic palettes from `docs/superpowers/specs/2026-08-03-system-theme-design.md`.
- Every production behavior starts with a failing test and completes with focused and full-suite verification.

---

### Task 1: Theme persistence, resolution, and provider

**Files:**
- Create: `Android/src/theme/themeStorage.ts`
- Create: `Android/src/theme/theme.tsx`
- Create: `Android/__tests__/themeStorage.test.ts`
- Create: `Android/__tests__/theme.test.tsx`

**Interfaces:**
- Produces: `ThemePreference`, `ResolvedTheme`, `ThemeColors`, `lightPalette`, `darkPalette`, `resolveTheme()`, `ThemeProvider`, and `useTheme()`.
- Produces: `loadThemePreference(): Promise<ThemePreference>` and `saveThemePreference(preference): Promise<boolean>`.
- Consumers: AppearanceModal and all themed app components in later tasks.

- [ ] **Step 1: Write failing storage tests**

Create `Android/__tests__/themeStorage.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  THEME_PREFERENCE_KEY,
  loadThemePreference,
  saveThemePreference,
} from '../src/theme/themeStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = jest.mocked(AsyncStorage.getItem);
const setItem = jest.mocked(AsyncStorage.setItem);

beforeEach(() => jest.clearAllMocks());

test.each(['system', 'light', 'dark'] as const)('loads valid %s preference', async (value) => {
  getItem.mockResolvedValue(value);
  await expect(loadThemePreference()).resolves.toBe(value);
  expect(getItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY);
});

test.each([null, '', 'sepia', '{"theme":"dark"}'])('falls back for invalid stored value %p', async (value) => {
  getItem.mockResolvedValue(value);
  await expect(loadThemePreference()).resolves.toBe('system');
});

test('falls back when reading fails', async () => {
  getItem.mockRejectedValue(new Error('read failed'));
  await expect(loadThemePreference()).resolves.toBe('system');
});

test('returns true after saving', async () => {
  setItem.mockResolvedValue();
  await expect(saveThemePreference('dark')).resolves.toBe(true);
  expect(setItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY, 'dark');
});

test('returns false when saving fails', async () => {
  setItem.mockRejectedValue(new Error('write failed'));
  await expect(saveThemePreference('light')).resolves.toBe(false);
});
```

- [ ] **Step 2: Run the storage test and verify RED**

Run:

```powershell
cd Android
npm.cmd test -- --runTestsByPath __tests__/themeStorage.test.ts
```

Expected: FAIL because `src/theme/themeStorage.ts` does not exist.

- [ ] **Step 3: Implement theme preference storage**

Create `Android/src/theme/themeStorage.ts`:

```ts
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
```

- [ ] **Step 4: Run the storage test and verify GREEN**

Run the command from Step 2.

Expected: 10 tests pass.

- [ ] **Step 5: Write failing resolver/provider tests**

Create `Android/__tests__/theme.test.tsx`:

```tsx
import React from 'react';
import { ColorSchemeName, Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  darkPalette,
  lightPalette,
  resolveTheme,
  ThemeProvider,
  useTheme,
} from '../src/theme/theme';
import * as themeStorage from '../src/theme/themeStorage';

let mockSystemScheme: ColorSchemeName = 'light';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return { ...actual, useColorScheme: () => mockSystemScheme };
});

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

function Probe() {
  const theme = useTheme();
  return (
    <>
      <Text testID="preference">{theme.preference}</Text>
      <Text testID="resolved">{theme.resolvedTheme}</Text>
      <Text testID="background">{theme.colors.background}</Text>
      <Text testID="save-error">{theme.saveError ?? ''}</Text>
      <Pressable accessibilityLabel="choose dark" onPress={() => theme.setPreference('dark')} />
      <Pressable accessibilityLabel="clear error" onPress={theme.clearSaveError} />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSystemScheme = 'light';
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('system');
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
});

test.each([
  ['system', 'light', 'light'],
  ['system', 'dark', 'dark'],
  ['system', null, 'light'],
  ['light', 'dark', 'light'],
  ['dark', 'light', 'dark'],
] as const)('resolves %s with system %s to %s', (preference, system, expected) => {
  expect(resolveTheme(preference, system)).toBe(expected);
});

test('starts from the live system theme', async () => {
  mockSystemScheme = 'dark';
  render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  expect(screen.getByTestId('background')).toHaveTextContent(darkPalette.background);
  await waitFor(() => expect(themeStorage.loadThemePreference).toHaveBeenCalled());
});

test('loads a persisted manual override', async () => {
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('dark');
  render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByTestId('preference')).toHaveTextContent('dark'));
  expect(screen.getByTestId('background')).toHaveTextContent(darkPalette.background);
});

test('reacts to system changes only in system mode', async () => {
  const view = render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByTestId('preference')).toHaveTextContent('system'));
  mockSystemScheme = 'dark';
  view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByTestId('resolved')).toHaveTextContent('dark');

  await act(async () => fireEvent.press(screen.getByLabelText('choose dark')));
  mockSystemScheme = 'light';
  view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
});

test('keeps the selection and exposes an error when saving fails', async () => {
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(false);
  render(<ThemeProvider><Probe /></ThemeProvider>);
  await act(async () => fireEvent.press(screen.getByLabelText('choose dark')));
  expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  expect(screen.getByTestId('save-error')).toHaveTextContent('Could not save appearance preference.');
  expect(screen.getByTestId('background')).toHaveTextContent(darkPalette.background);

  fireEvent.press(screen.getByLabelText('clear error'));
  expect(screen.getByTestId('save-error')).toHaveTextContent('');
  expect(lightPalette.background).toBe('#EEF2F5');
});
```

- [ ] **Step 6: Run the provider test and verify RED**

Run:

```powershell
npm.cmd test -- --runTestsByPath __tests__/theme.test.tsx
```

Expected: FAIL because `src/theme/theme.tsx` does not exist.

- [ ] **Step 7: Implement the theme provider and palettes**

Create `Android/src/theme/theme.tsx` with the exact public types and behavior below:

```tsx
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
```

- [ ] **Step 8: Run focused theme tests and the full suite**

Run:

```powershell
npm.cmd test -- --runTestsByPath __tests__/themeStorage.test.ts __tests__/theme.test.tsx
npm.cmd test
```

Expected: focused tests pass and the existing 55 tests remain green.

- [ ] **Step 9: Commit the theme core**

```powershell
git add Android/src/theme/theme.tsx Android/src/theme/themeStorage.ts Android/__tests__/theme.test.tsx Android/__tests__/themeStorage.test.ts
git commit -m "feat: add persisted theme preferences"
```

---

### Task 2: Accessible Appearance settings modal

**Files:**
- Create: `Android/src/components/AppearanceModal.tsx`
- Create: `Android/__tests__/AppearanceModal.test.tsx`

**Interfaces:**
- Consumes: `ThemePreference` and `useTheme()` from Task 1.
- Produces: `AppearanceModal` with props `visible`, `preference`, `error`, `onCancel`, and asynchronous `onSelect`.

- [ ] **Step 1: Write the failing modal tests**

Create `Android/__tests__/AppearanceModal.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AppearanceModal from '../src/components/AppearanceModal';
import { ThemeProvider } from '../src/theme/theme';
import * as themeStorage from '../src/theme/themeStorage';

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('system');
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
});

function renderModal(props: Partial<React.ComponentProps<typeof AppearanceModal>> = {}) {
  const defaults: React.ComponentProps<typeof AppearanceModal> = {
    visible: true,
    preference: 'system',
    error: null,
    onCancel: jest.fn(),
    onSelect: jest.fn().mockResolvedValue(undefined),
  };
  return render(<ThemeProvider><AppearanceModal {...defaults} {...props} /></ThemeProvider>);
}

test('marks the current preference as selected', () => {
  renderModal({ preference: 'dark' });
  expect(screen.getByLabelText('Dark appearance').props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText('System appearance').props.accessibilityState.selected).toBe(false);
});

test('submits the chosen preference', async () => {
  const onSelect = jest.fn().mockResolvedValue(undefined);
  renderModal({ onSelect });
  fireEvent.press(screen.getByLabelText('Light appearance'));
  await waitFor(() => expect(onSelect).toHaveBeenCalledWith('light'));
});

test('blocks repeated choices while a save is pending', async () => {
  let resolveSave!: () => void;
  const onSelect = jest.fn(() => new Promise<void>((resolve) => { resolveSave = resolve; }));
  renderModal({ onSelect });
  fireEvent.press(screen.getByLabelText('Dark appearance'));
  fireEvent.press(screen.getByLabelText('Light appearance'));
  expect(onSelect).toHaveBeenCalledTimes(1);
  resolveSave();
  await waitFor(() => expect(screen.getByLabelText('Dark appearance').props.accessibilityState.disabled).toBe(false));
});

test('shows a persistence error and supports cancellation', () => {
  const onCancel = jest.fn();
  renderModal({ error: 'Could not save appearance preference.', onCancel });
  expect(screen.getByText('Could not save appearance preference.')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Cancel appearance settings'));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the modal tests and verify RED**

```powershell
npm.cmd test -- --runTestsByPath __tests__/AppearanceModal.test.tsx
```

Expected: FAIL because `AppearanceModal.tsx` does not exist.

- [ ] **Step 3: Implement AppearanceModal**

Create `Android/src/components/AppearanceModal.tsx` with these exact responsibilities:

```tsx
import React, { useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors, ThemePreference, useTheme } from '../theme/theme';

interface Props {
  visible: boolean;
  preference: ThemePreference;
  error: string | null;
  onCancel: () => void;
  onSelect: (preference: ThemePreference) => Promise<void>;
}

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceModal({ visible, preference, error, onCancel, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const choose = async (next: ThemePreference) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      await onSelect(next);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const cancel = () => {
    if (!inFlight.current) onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="appearance-modal-sheet">
          <Text style={styles.title}>Appearance</Text>
          {OPTIONS.map((option) => {
            const selected = option.value === preference;
            return (
              <TouchableOpacity
                key={option.value}
                accessibilityLabel={`${option.label} appearance`}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: saving }}
                disabled={saving}
                style={[styles.option, selected && styles.selectedOption]}
                onPress={() => choose(option.value)}
              >
                <Text style={[styles.optionText, selected && styles.selectedText]}>{option.label}</Text>
                <Text style={styles.check}>{selected ? '✓' : ''}</Text>
              </TouchableOpacity>
            );
          })}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            accessibilityLabel="Cancel appearance settings"
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            style={[styles.cancel, saving && styles.disabled]}
            onPress={cancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay },
  sheet: { borderRadius: 14, padding: 20, backgroundColor: colors.surface },
  title: { marginBottom: 14, color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  option: {
    minHeight: 48,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 9,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.surfaceSecondary },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  selectedText: { color: colors.primary },
  check: { minWidth: 20, color: colors.primary, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  error: { marginTop: 4, color: colors.danger, fontSize: 14, textAlign: 'center' },
  cancel: { minHeight: 46, marginTop: 10, borderRadius: 9, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
```

- [ ] **Step 4: Run modal and full tests and verify GREEN**

```powershell
npm.cmd test -- --runTestsByPath __tests__/AppearanceModal.test.tsx
npm.cmd test
```

Expected: four modal tests and all existing tests pass.

- [ ] **Step 5: Commit the Appearance modal**

```powershell
git add Android/src/components/AppearanceModal.tsx Android/__tests__/AppearanceModal.test.tsx
git commit -m "feat: add appearance settings modal"
```

---

### Task 3: Theme existing input, picker, and item-modal controls

**Files:**
- Modify: `Android/src/components/InputField.tsx`
- Modify: `Android/src/components/ScrollablePicker.tsx`
- Modify: `Android/src/components/AddItemModal.tsx`
- Modify: `Android/__tests__/AddItemModal.test.tsx`
- Create: `Android/__tests__/ThemedControls.test.tsx`

**Interfaces:**
- Consumes: `useTheme()` and `ThemeColors` from Task 1.
- Preserves: all existing component props, calculation behavior, test IDs, persistence guards, and validation errors.
- Adds: `picker-wrapper` and `add-item-sheet` test IDs only for semantic style verification.

- [ ] **Step 1: Write failing dark-control tests**

Create `Android/__tests__/ThemedControls.test.tsx`:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import InputField from '../src/components/InputField';
import ScrollablePicker from '../src/components/ScrollablePicker';
import AddItemModal from '../src/components/AddItemModal';
import { darkPalette, ThemeProvider } from '../src/theme/theme';
import * as themeStorage from '../src/theme/themeStorage';

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('dark');
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
});

test('themes numeric inputs in dark mode', async () => {
  render(<ThemeProvider><InputField title="Width" value="" onChangeText={jest.fn()} testID="width" /></ThemeProvider>);
  await waitFor(() => expect(screen.getByTestId('width')).toHaveStyle({
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
    color: darkPalette.text,
  }));
  expect(screen.getByPlaceholderText('Width').props.placeholderTextColor).toBe(darkPalette.textSubtle);
});

test('themes picker surface in dark mode', async () => {
  render(<ThemeProvider><ScrollablePicker title="Select Tube" options={['1TU']} selection="" onSelect={jest.fn()} /></ThemeProvider>);
  await waitFor(() => expect(screen.getByTestId('select-tube-picker-wrapper')).toHaveStyle({
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.border,
  }));
});

test('themes add-item modal surface in dark mode', async () => {
  render(
    <ThemeProvider>
      <AddItemModal
        visible
        title="Add Fabric"
        fields={[{ key: 'name', label: 'Name', numeric: false }]}
        onCancel={jest.fn()}
        validate={() => ({ ok: false, error: 'Name is required.' })}
        onSubmit={jest.fn()}
      />
    </ThemeProvider>
  );
  await waitFor(() => expect(screen.getByTestId('add-item-sheet')).toHaveStyle({ backgroundColor: darkPalette.surface }));
  expect(screen.getByPlaceholderText('Name')).toHaveStyle({ color: darkPalette.text });
});
```

- [ ] **Step 2: Run themed-control tests and verify RED**

```powershell
npm.cmd test -- --runTestsByPath __tests__/ThemedControls.test.tsx
```

Expected: FAIL because controls still use static light styles and the new wrapper/sheet test IDs do not exist.

- [ ] **Step 3: Theme InputField**

Update `InputField.tsx` to import `useMemo`, `ThemeColors`, and `useTheme`; create styles inside the component; pass `placeholderTextColor={colors.textSubtle}` and `selectionColor={colors.primary}` to TextInput. Replace the static stylesheet with:

```ts
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 5 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 3 },
});
```

The component body must begin with:

```ts
const { colors } = useTheme();
const styles = useMemo(() => createStyles(colors), [colors]);
```

- [ ] **Step 4: Theme ScrollablePicker**

Use the same palette hook pattern. Add `testID={`${testID}-wrapper`}` to `pickerWrapper`; add `dropdownIconColor={colors.textMuted}` to Picker; and replace the static stylesheet with:

```ts
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  addButton: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    height: PICKER_HEIGHT,
    justifyContent: 'center',
  },
  picker: { height: PICKER_HEIGHT, color: colors.text, backgroundColor: colors.surface },
  pickerItem: { height: PICKER_HEIGHT, fontSize: 16, color: colors.text },
});
```

- [ ] **Step 5: Theme AddItemModal without changing its async guards**

Import and memoize the palette as above. Add `testID="add-item-sheet"` to the sheet View. Add `placeholderTextColor={colors.textSubtle}` and `selectionColor={colors.primary}` to every TextInput. Replace only the static style definitions with:

```ts
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, maxHeight: '85%' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  fieldRow: { marginBottom: 12 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  buttonRow: { flexDirection: 'row', marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.surfaceSecondary, marginRight: 8 },
  saveButton: { backgroundColor: colors.primary, marginLeft: 8 },
  disabledButton: { opacity: 0.4 },
  cancelText: { fontSize: 16, fontWeight: '600', color: colors.text },
  saveText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  errorText: { color: colors.danger, fontSize: 14, marginTop: 4, textAlign: 'center' },
  removeAllButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSurface,
    alignItems: 'center',
  },
  removeAllText: { fontSize: 14, fontWeight: '600', color: colors.danger },
});
```

- [ ] **Step 6: Preserve existing AddItemModal unit isolation**

At the top of `AddItemModal.test.tsx`, mock only the theme hook while keeping the real palette contract:

```ts
jest.mock('../src/theme/theme', () => {
  const actual = jest.requireActual('../src/theme/theme');
  return {
    ...actual,
    useTheme: () => ({
      preference: 'system',
      resolvedTheme: 'light',
      colors: actual.lightPalette,
      saveError: null,
      setPreference: jest.fn(),
      clearSaveError: jest.fn(),
    }),
  };
});
```

- [ ] **Step 7: Run focused and full tests and verify GREEN**

```powershell
npm.cmd test -- --runTestsByPath __tests__/ThemedControls.test.tsx __tests__/AddItemModal.test.tsx
npm.cmd test
```

Expected: the three dark-control tests, all AddItemModal tests, and the entire suite pass.

- [ ] **Step 8: Commit themed controls**

```powershell
git add Android/src/components/InputField.tsx Android/src/components/ScrollablePicker.tsx Android/src/components/AddItemModal.tsx Android/__tests__/ThemedControls.test.tsx Android/__tests__/AddItemModal.test.tsx
git commit -m "feat: theme calculator controls"
```

---

### Task 4: App integration, gear settings, status bar, and Expo configuration

**Files:**
- Modify: `Android/App.tsx`
- Modify: `Android/app.json`
- Modify: `Android/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `ThemeProvider`, `useTheme()`, and `AppearanceModal`.
- Produces: accessible gear entry point, immediate/persisted selection flow, dynamic StatusBar, and automatic native appearance configuration.
- Preserves: existing calculator rendering, input validation, item management, and result test IDs.

- [ ] **Step 1: Add failing App interaction tests**

Add these imports and theme-storage mock to `App.test.tsx`:

```tsx
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as themeStorage from '../src/theme/themeStorage';

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));
```

Extend `beforeEach` with:

```ts
jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('system');
jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
```

Add these tests:

```tsx
test('opens Appearance settings from the accessible gear', async () => {
  render(<App />);
  fireEvent.press(screen.getByLabelText('Appearance settings'));
  expect(screen.getByText('Appearance')).toBeTruthy();
  expect(screen.getByLabelText('System appearance').props.accessibilityState.selected).toBe(true);
});

test('applies and persists a dark override', async () => {
  const view = render(<App />);
  fireEvent.press(screen.getByLabelText('Appearance settings'));
  fireEvent.press(screen.getByLabelText('Dark appearance'));
  await waitFor(() => expect(themeStorage.saveThemePreference).toHaveBeenCalledWith('dark'));
  await waitFor(() => expect(screen.queryByText('Appearance')).toBeNull());
  expect(view.UNSAFE_getByType(ExpoStatusBar).props.style).toBe('light');
  expect(screen.getByTestId('app-root')).toHaveStyle({ backgroundColor: '#101418' });
});

test('keeps settings open when preference persistence fails', async () => {
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(false);
  render(<App />);
  fireEvent.press(screen.getByLabelText('Appearance settings'));
  fireEvent.press(screen.getByLabelText('Dark appearance'));
  expect(await screen.findByText('Could not save appearance preference.')).toBeTruthy();
  expect(screen.getByText('Appearance')).toBeTruthy();
});
```

- [ ] **Step 2: Run App tests and verify RED**

```powershell
npm.cmd test -- --runTestsByPath __tests__/App.test.tsx
```

Expected: new tests fail because the provider, gear, modal integration, dynamic StatusBar, and themed root do not exist.

- [ ] **Step 3: Wrap the calculator with ThemeProvider**

In `App.tsx`:

1. Import `useMemo` from React.
2. Import `AppearanceModal`.
3. Import `ThemeColors`, `ThemePreference`, `ThemeProvider`, and `useTheme`.
4. Rename the current exported function to `function CalculatorApp()`.
5. Add the following default export after CalculatorApp:

```tsx
export default function App() {
  return (
    <ThemeProvider>
      <CalculatorApp />
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: Integrate theme state and Appearance modal**

At the top of `CalculatorApp`, add:

```tsx
const {
  preference,
  resolvedTheme,
  colors,
  saveError,
  setPreference,
  clearSaveError,
} = useTheme();
const styles = useMemo(() => createStyles(colors), [colors]);
const [appearanceVisible, setAppearanceVisible] = useState(false);

const openAppearance = () => {
  clearSaveError();
  setAppearanceVisible(true);
};

const closeAppearance = () => {
  clearSaveError();
  setAppearanceVisible(false);
};

const selectAppearance = async (next: ThemePreference) => {
  const saved = await setPreference(next);
  if (saved) setAppearanceVisible(false);
};
```

Change the root and StatusBar to:

```tsx
<SafeAreaView style={styles.safe} testID="app-root">
  <ExpoStatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
```

Add this gear as the final child of the header View:

```tsx
<TouchableOpacity
  accessibilityLabel="Appearance settings"
  accessibilityRole="button"
  style={styles.settingsButton}
  onPress={openAppearance}
>
  <Text style={styles.settingsIcon}>⚙</Text>
</TouchableOpacity>
```

Render this after the existing AddItemModal instances and before closing SafeAreaView:

```tsx
<AppearanceModal
  visible={appearanceVisible}
  preference={preference}
  error={saveError}
  onCancel={closeAppearance}
  onSelect={selectAppearance}
/>
```

- [ ] **Step 5: Convert App styles to semantic colors**

Rename `const styles = StyleSheet.create` to `const createStyles = (colors: ThemeColors) => StyleSheet.create` and make these exact color substitutions while retaining every existing layout value:

```ts
safe.backgroundColor = colors.background
heading.color = colors.text
results.backgroundColor = colors.surface
results.borderColor = colors.border
results.shadowColor = colors.shadow
resultLabel.color = colors.textMuted
resultValue.color = colors.text
resultSub.color = colors.textSubtle
divider.backgroundColor = colors.divider
note.color = colors.text
noteRed.color = colors.danger
link.color = colors.primary
contact.color = colors.text
```

Add:

```ts
settingsButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
},
settingsIcon: {
  color: colors.primary,
  fontSize: 22,
  lineHeight: 24,
},
```

- [ ] **Step 6: Allow native automatic appearance**

In `Android/app.json`, replace:

```json
"userInterfaceStyle": "light"
```

with:

```json
"userInterfaceStyle": "automatic"
```

Do not change splash or adaptive-icon backgrounds.

- [ ] **Step 7: Run App, type, lint, and full tests and verify GREEN**

```powershell
npm.cmd test -- --runTestsByPath __tests__/App.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

Expected: App interaction tests pass, typecheck/lint exit 0, and the full suite passes.

- [ ] **Step 8: Commit app integration**

```powershell
git add Android/App.tsx Android/app.json Android/__tests__/App.test.tsx
git commit -m "feat: follow system appearance with overrides"
```

---

### Task 5: Documentation and end-to-end verification

**Files:**
- Modify: `Android/README.md`

**Interfaces:**
- Documents: default System behavior, settings gear, persistence, and Expo Go manual test flow.
- Verifies: the complete branch rather than any isolated unit.

- [ ] **Step 1: Update project layout and usage documentation**

Add these entries under `src/` in the README project tree:

```text
  theme/
    theme.tsx               palettes, system resolution, provider
    themeStorage.ts         persisted appearance preference
  components/
    AppearanceModal.tsx     System / Light / Dark settings
```

Add this section after “Install and run with Expo Go”:

```markdown
## Appearance

The app follows the Android system light/dark setting on first install. Tap the
gear in the header to select System, Light, or Dark. Manual Light/Dark choices
are stored locally and restored after the app restarts; choosing System resumes
live Android appearance changes.

For a manual smoke test, leave the app open in System mode and switch Android
between light and dark. Then select a manual override, reload Expo Go, confirm
the override persists, and return to System.
```

- [ ] **Step 2: Run the complete automated quality gate**

```powershell
cd Android
npm.cmd run check
npx.cmd expo install --check
```

Expected: typecheck, lint, every Jest suite, and Expo compatibility check pass.

- [ ] **Step 3: Run an Android production-bundle smoke test**

```powershell
$themeExport = Join-Path $env:TEMP 'zmc-system-theme-export'
if (Test-Path -LiteralPath $themeExport) { Remove-Item -LiteralPath $themeExport -Recurse -Force }
npx.cmd expo export --platform android --clear --output-dir $themeExport
```

Expected: Metro exports an Android bundle successfully into the exact temporary directory. Verify the resolved path remains under `$env:TEMP` before removing it after inspection.

- [ ] **Step 4: Run Expo Go manual verification**

```powershell
npm.cmd start -- --clear
```

Verify on Android:

1. Fresh/cleared preference starts in System.
2. Switching Android light/dark updates the open app in System mode.
3. Gear opens Appearance settings with the current choice selected.
4. Light and Dark overrides apply immediately.
5. Reloading Expo Go preserves a manual override.
6. Returning to System resumes live device changes.
7. Inputs, dropdowns, results, add-item modals, validation errors, and footer remain readable in both themes.
8. The known 72-by-96 calculation still displays `3.845 lb`, `1.574 in`, and `0.127 in`.

- [ ] **Step 5: Review the final diff and commit documentation**

```powershell
git diff --check
git status --short
git diff main...HEAD --stat
git add Android/README.md
git commit -m "docs: explain appearance settings"
```

- [ ] **Step 6: Perform the final pre-publish verification**

```powershell
npm.cmd run check
npx.cmd expo install --check
git status --short --branch
```

Expected: every command exits 0 and the branch is clean before pushing `feature/system-theme` and opening a draft PR into `main`.
