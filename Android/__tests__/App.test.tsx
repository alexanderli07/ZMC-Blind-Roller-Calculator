jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import App from '../App';
import * as storage from '../src/storage';
import * as themeStorage from '../src/theme/themeStorage';
import { defaultSettings, SETTINGS_KEY } from '../src/settings/settingsStorage';
import fabrics from '../src/data/fabricTypes.json';
import tubes from '../src/data/tubes.json';
import bottomBars from '../src/data/bottomBars.json';

jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(() => null),
}));

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

jest.mock('../src/storage', () => ({
  loadFabricTypes: jest.fn(),
  loadTubes: jest.fn(),
  loadBottomBars: jest.fn(),
  loadCustomFabricTypes: jest.fn(),
  loadCustomTubes: jest.fn(),
  loadCustomBottomBars: jest.fn(),
  addFabricType: jest.fn(),
  addTube: jest.fn(),
  addBottomBar: jest.fn(),
  removeFabricType: jest.fn(),
  removeTube: jest.fn(),
  removeBottomBar: jest.fn(),
  clearFabricTypes: jest.fn(),
  clearTubes: jest.fn(),
  clearBottomBars: jest.fn(),
  clearAllCustom: jest.fn(),
  exportLibrary: jest.fn(),
  importLibrary: jest.fn(),
}));

// The three decimal-place settings default to what each quantity actually
// warrants; these tests pin the raw numbers, so ask for three places.
async function seedSettings(overrides: Record<string, unknown> = {}) {
  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      ...defaultSettings,
      weightDecimals: 3,
      diameterDecimals: 3,
      deflectionDecimals: 3,
      ...overrides,
    })
  );
}

async function chooseEverything(screen: ReturnType<typeof render>) {
  await waitFor(() => expect(storage.loadBottomBars).toHaveBeenCalled());

  await fireEvent.press(screen.getByTestId('tube-select-row'));
  await fireEvent.press(screen.getByLabelText('1TU'));
  await fireEvent.press(screen.getByTestId('fabric-select-row'));
  await fireEvent.press(screen.getByLabelText('deluxe'));
  await fireEvent.press(screen.getByTestId('bottom-bar-select-row'));
  await fireEvent.press(screen.getByLabelText('slim bottom bar w/fab insert'));
  await fireEvent.changeText(screen.getByTestId('blind-width-input'), '72');
  await fireEvent.changeText(screen.getByTestId('blind-height-input'), '96');
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('system');
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
  jest.mocked(storage.loadFabricTypes).mockResolvedValue(fabrics);
  jest.mocked(storage.loadTubes).mockResolvedValue(tubes);
  jest.mocked(storage.loadBottomBars).mockResolvedValue(bottomBars);
  jest.mocked(storage.loadCustomFabricTypes).mockResolvedValue([]);
  jest.mocked(storage.loadCustomTubes).mockResolvedValue([]);
  jest.mocked(storage.loadCustomBottomBars).mockResolvedValue([]);
});

describe('<App />', () => {
  test('starts with placeholders instead of fallback calculations', async () => {
    const screen = await render(<App />);
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
    expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('—');
    expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('—');
    await waitFor(() => expect(storage.loadTubes).toHaveBeenCalled());
  });

  test('prompts for the missing inputs before anything is chosen', async () => {
    const screen = await render(<App />);
    expect(screen.getByText('Pick a tube, fabric, bar, and size.')).toBeTruthy();
  });

  test('renders the known result after every input is complete', async () => {
    await seedSettings();
    const screen = await render(<App />);
    await chooseEverything(screen);

    // Waits out the stored-settings load that raises precision to three places.
    await waitFor(() =>
      expect(screen.getByTestId('total-weight-result')).toHaveTextContent('3.845 lb')
    );
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('1.744 kg');

    const diameter = screen.getByTestId('roller-diameter-result');
    expect(diameter).toHaveTextContent('1.574 in');
    expect(diameter).toHaveTextContent('39.975 mm');

    const deflection = screen.getByTestId('tube-deflection-result');
    expect(deflection).toHaveTextContent('0.127 in');
    expect(deflection).toHaveTextContent('3.223 mm');
  });

  test('reports deflection against the configured limit', async () => {
    await seedSettings();
    const screen = await render(<App />);
    await chooseEverything(screen);

    await waitFor(() =>
      expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('Within limit')
    );
    expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('Max 0.375 in');
  });

  test('flags deflection over a tightened limit', async () => {
    await seedSettings({ maxDeflectionIn: 0.05 });
    const screen = await render(<App />);
    await chooseEverything(screen);

    await waitFor(() =>
      expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('Over limit')
    );
  });

  test('shows dimension guidance for a nonpositive entered value', async () => {
    const screen = await render(<App />);
    await fireEvent.changeText(screen.getByTestId('blind-width-input'), '0');
    expect(screen.getByText('Enter a number greater than 0.')).toBeTruthy();
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
  });

  test('converts entered dimensions when the unit toggle changes', async () => {
    const screen = await render(<App />);
    await fireEvent.changeText(screen.getByTestId('blind-width-input'), '48');
    await fireEvent.press(screen.getByLabelText('Millimetres'));

    await waitFor(() =>
      expect(screen.getByTestId('blind-width-input').props.value).toBe('1219.2')
    );
  });

  test('opens settings from the accessible gear', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Settings'));
    expect(await view.findByText('Settings')).toBeTruthy();
    expect(view.getByLabelText('System appearance').props.accessibilityState.selected).toBe(true);
  });

  test('applies and persists a dark override', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Settings'));
    await fireEvent.press(await view.findByLabelText('Dark appearance'));

    await waitFor(() => expect(themeStorage.saveThemePreference).toHaveBeenCalledWith('dark'));
    expect(view.getByLabelText('Dark appearance').props.accessibilityState.selected).toBe(true);
    expect(jest.mocked(ExpoStatusBar).mock.calls.at(-1)?.[0].style).toBe('light');
    expect(view.getByTestId('app-root')).toHaveStyle({ backgroundColor: '#101418' });
  });

  test('surfaces a failure to persist the appearance preference', async () => {
    jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(false);
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Settings'));
    await fireEvent.press(await view.findByLabelText('Dark appearance'));

    expect(await view.findByText('Could not save appearance preference.')).toBeTruthy();
    expect(view.getByLabelText('Dark appearance').props.accessibilityState.selected).toBe(true);
  });

  test('persists a changed unit preference', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Settings'));
    await fireEvent.press(await view.findByLabelText('Metric units'));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      expect(JSON.parse(stored ?? '{}').units).toBe('metric');
    });
  });
});
