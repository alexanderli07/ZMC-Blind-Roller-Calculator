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

test('themes picker surface in dark mode', async () => {
  await render(
    <ThemeProvider>
      <ScrollablePicker
        title="Select Tube"
        options={['1TU']}
        selection=""
        onSelect={jest.fn()}
      />
    </ThemeProvider>
  );

  await waitFor(() =>
    expect(screen.getByTestId('select-tube-picker-wrapper')).toHaveStyle({
      backgroundColor: darkPalette.surface,
      borderColor: darkPalette.border,
    })
  );
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
