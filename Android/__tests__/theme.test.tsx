import React from 'react';
import { ColorSchemeName, Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  darkPalette,
  lightPalette,
  resolveTheme,
  ThemeProvider,
  useTheme,
} from '../src/theme/theme';
import * as themeStorage from '../src/theme/themeStorage';

let mockSystemScheme: ColorSchemeName = 'light';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockSystemScheme,
}));

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
  const view = await render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(view.getByTestId('resolved')).toHaveTextContent('dark');
  expect(view.getByTestId('background')).toHaveTextContent(darkPalette.background);
  await waitFor(() => expect(themeStorage.loadThemePreference).toHaveBeenCalled());
});

test('loads a persisted manual override', async () => {
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('dark');
  const view = await render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(view.getByTestId('preference')).toHaveTextContent('dark'));
  expect(view.getByTestId('background')).toHaveTextContent(darkPalette.background);
});

test('reacts to system changes only in system mode', async () => {
  const view = await render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(view.getByTestId('preference')).toHaveTextContent('system'));
  mockSystemScheme = 'dark';
  await view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(view.getByTestId('resolved')).toHaveTextContent('dark');

  await act(async () => fireEvent.press(view.getByLabelText('choose dark')));
  mockSystemScheme = 'light';
  await view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(view.getByTestId('resolved')).toHaveTextContent('dark');
});

test('keeps the selection and exposes an error when saving fails', async () => {
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(false);
  const view = await render(<ThemeProvider><Probe /></ThemeProvider>);
  await act(async () => fireEvent.press(view.getByLabelText('choose dark')));
  expect(view.getByTestId('resolved')).toHaveTextContent('dark');
  expect(view.getByTestId('save-error')).toHaveTextContent('Could not save appearance preference.');
  expect(view.getByTestId('background')).toHaveTextContent(darkPalette.background);

  await act(async () => fireEvent.press(view.getByLabelText('clear error')));
  expect(view.getByTestId('save-error')).toHaveTextContent('');
  expect(lightPalette.background).toBe('#EEF2F5');
});
