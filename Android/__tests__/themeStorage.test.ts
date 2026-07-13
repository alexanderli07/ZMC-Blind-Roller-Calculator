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
