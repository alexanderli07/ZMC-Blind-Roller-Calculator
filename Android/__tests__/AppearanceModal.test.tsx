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

async function renderModal(props: Partial<React.ComponentProps<typeof AppearanceModal>> = {}) {
  const defaults: React.ComponentProps<typeof AppearanceModal> = {
    visible: true,
    preference: 'system',
    error: null,
    onCancel: jest.fn(),
    onSelect: jest.fn().mockResolvedValue(undefined),
  };
  return render(<ThemeProvider><AppearanceModal {...defaults} {...props} /></ThemeProvider>);
}

test('marks the current preference as selected', async () => {
  await renderModal({ preference: 'dark' });
  expect(screen.getByLabelText('Dark appearance').props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText('System appearance').props.accessibilityState.selected).toBe(false);
});

test('submits the chosen preference', async () => {
  const onSelect = jest.fn().mockResolvedValue(undefined);
  await renderModal({ onSelect });
  await fireEvent.press(screen.getByLabelText('Light appearance'));
  await waitFor(() => expect(onSelect).toHaveBeenCalledWith('light'));
});

test('blocks repeated choices while a save is pending', async () => {
  let resolveSave!: () => void;
  const onSelect = jest.fn(() => new Promise<void>((resolve) => { resolveSave = resolve; }));
  await renderModal({ onSelect });
  await fireEvent.press(screen.getByLabelText('Dark appearance'));
  await fireEvent.press(screen.getByLabelText('Light appearance'));
  expect(onSelect).toHaveBeenCalledTimes(1);
  resolveSave();
  await waitFor(() => expect(screen.getByLabelText('Dark appearance').props.accessibilityState.disabled).toBe(false));
});

test('shows a persistence error and supports cancellation', async () => {
  const onCancel = jest.fn();
  await renderModal({ error: 'Could not save appearance preference.', onCancel });
  expect(screen.getByText('Could not save appearance preference.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Cancel appearance settings'));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
