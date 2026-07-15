import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import InputField from '../src/components/InputField';
import SelectSheet from '../src/components/SelectSheet';
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
  await render(
    <ThemeProvider>
      <InputField title="Width" value="" onChangeText={jest.fn()} testID="width" />
    </ThemeProvider>
  );

  await waitFor(() =>
    expect(screen.getByTestId('width')).toHaveStyle({
      backgroundColor: darkPalette.surface,
      borderColor: darkPalette.border,
      color: darkPalette.text,
    })
  );
  expect(screen.getByPlaceholderText('Width').props.placeholderTextColor).toBe(
    darkPalette.textSubtle
  );
});

test('themes the select sheet in dark mode', async () => {
  await render(
    <ThemeProvider>
      <SelectSheet
        visible
        title="Tube"
        searchPlaceholder="Search tubes"
        items={[{ name: '1TU', detail: 'Ø 1.25 in · 0.192 lb/ft', custom: false }]}
        selected=""
        onSelect={jest.fn()}
        onAdd={jest.fn()}
        onRemove={jest.fn()}
        onClose={jest.fn()}
        testID="tube-sheet"
      />
    </ThemeProvider>
  );

  await waitFor(() =>
    expect(screen.getByTestId('tube-sheet')).toHaveStyle({
      backgroundColor: darkPalette.background,
    })
  );
  expect(screen.getByPlaceholderText('Search tubes').props.placeholderTextColor).toBe(
    darkPalette.textSubtle
  );
  expect(screen.getByText('Ø 1.25 in · 0.192 lb/ft')).toBeTruthy();
});

test('themes add-item modal surface in dark mode', async () => {
  await render(
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

  await waitFor(() =>
    expect(screen.getByTestId('add-item-sheet')).toHaveStyle({
      backgroundColor: darkPalette.surface,
    })
  );
  expect(screen.getByPlaceholderText('Name')).toHaveStyle({ color: darkPalette.text });
});
