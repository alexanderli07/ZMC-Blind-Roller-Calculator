jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultSettings,
  loadSettings,
  MAX_DECIMALS,
  MIN_DECIMALS,
  normalizeSelection,
  normalizeSettings,
  saveSettings,
  SETTINGS_KEY,
} from '../src/settings/settingsStorage';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

test('falls back to the defaults for anything unusable', () => {
  expect(normalizeSettings(null)).toEqual(defaultSettings);
  expect(normalizeSettings('nope')).toEqual(defaultSettings);
  expect(normalizeSettings({})).toEqual(defaultSettings);
});

test('clamps decimal places into range', () => {
  expect(normalizeSettings({ weightDecimals: 99 }).weightDecimals).toBe(MAX_DECIMALS);
  expect(normalizeSettings({ deflectionDecimals: -4 }).deflectionDecimals).toBe(MIN_DECIMALS);
  expect(normalizeSettings({ diameterDecimals: 2.4 }).diameterDecimals).toBe(2);
});

test('refuses a deflection limit that is not a positive number', () => {
  expect(normalizeSettings({ maxDeflectionIn: 0 }).maxDeflectionIn).toBe(
    defaultSettings.maxDeflectionIn
  );
  expect(normalizeSettings({ maxDeflectionIn: 'tight' }).maxDeflectionIn).toBe(
    defaultSettings.maxDeflectionIn
  );
  expect(normalizeSettings({ maxDeflectionIn: 0.25 }).maxDeflectionIn).toBe(0.25);
});

test('only accepts metric as an override of the imperial default', () => {
  expect(normalizeSettings({ units: 'metric' }).units).toBe('metric');
  expect(normalizeSettings({ units: 'furlongs' }).units).toBe('imperial');
});

test('keeps only string selection names', () => {
  expect(normalizeSelection({ tube: '3TU', fabric: 7 })).toEqual({
    tube: '3TU',
    fabric: '',
    bottomBar: '',
  });
  expect(normalizeSelection(null)).toEqual({ tube: '', fabric: '', bottomBar: '' });
});

test('round-trips through storage', async () => {
  const stored = { ...defaultSettings, units: 'metric' as const, weightDecimals: 4 };
  await expect(saveSettings(stored)).resolves.toBe(true);
  await expect(loadSettings()).resolves.toEqual(stored);
});

test('survives a corrupted payload', async () => {
  await AsyncStorage.setItem(SETTINGS_KEY, '{not json');
  await expect(loadSettings()).resolves.toEqual(defaultSettings);
});
