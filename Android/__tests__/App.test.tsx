import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import App from '../App';
import * as storage from '../src/storage';
import * as themeStorage from '../src/theme/themeStorage';
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
  addFabricType: jest.fn(),
  addTube: jest.fn(),
  addBottomBar: jest.fn(),
  clearFabricTypes: jest.fn(),
  clearTubes: jest.fn(),
  clearBottomBars: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('system');
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
  jest.mocked(storage.loadFabricTypes).mockResolvedValue(fabrics);
  jest.mocked(storage.loadTubes).mockResolvedValue(tubes);
  jest.mocked(storage.loadBottomBars).mockResolvedValue(bottomBars);
});

describe('<App />', () => {
  test('starts with placeholders instead of fallback calculations', async () => {
    const screen = await render(<App />);
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
    expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('—');
    expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('—');
    await waitFor(() => expect(storage.loadTubes).toHaveBeenCalled());
  });

  test('renders the known result after every input is complete', async () => {
    const screen = await render(<App />);
    await waitFor(() => expect(storage.loadBottomBars).toHaveBeenCalled());

    await fireEvent(screen.getByTestId('select-tube-picker'), 'valueChange', '1TU');
    await fireEvent(screen.getByTestId('select-fabric-type-picker'), 'valueChange', 'deluxe');
    await fireEvent(screen.getByTestId('select-bottom-bar-picker'), 'valueChange', 'slim bottom bar w/fab insert');
    await fireEvent.changeText(screen.getByTestId('blind-width-input'), '72');
    await fireEvent.changeText(screen.getByTestId('blind-height-input'), '96');

    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('3.845 lb (1.744 kg)');
    expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('1.574 in (39.975 mm)');
    expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('0.127 in (3.223 mm)');
  });

  test('shows dimension guidance for a nonpositive entered value', async () => {
    const screen = await render(<App />);
    await fireEvent.changeText(screen.getByTestId('blind-width-input'), '0');
    expect(screen.getByText('Enter a number greater than 0.')).toBeTruthy();
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
  });
  test('opens Appearance settings from the accessible gear', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Appearance settings'));
    expect(await view.findByText('Appearance')).toBeTruthy();
    expect(view.getByLabelText('System appearance').props.accessibilityState.selected).toBe(true);
  });

  test('applies and persists a dark override', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Appearance settings'));
    await fireEvent.press(await view.findByLabelText('Dark appearance'));
    await waitFor(() => expect(themeStorage.saveThemePreference).toHaveBeenCalledWith('dark'));
    await waitFor(() => expect(view.queryByText('Appearance')).toBeNull());
    expect(jest.mocked(ExpoStatusBar).mock.calls.at(-1)?.[0].style).toBe('light');
    expect(view.getByTestId('app-root')).toHaveStyle({ backgroundColor: '#101418' });
  });

  test('keeps settings open when preference persistence fails', async () => {
    jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(false);
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Appearance settings'));
    await fireEvent.press(await view.findByLabelText('Dark appearance'));
    expect(await view.findByText('Could not save appearance preference.')).toBeTruthy();
    expect(view.getByText('Appearance')).toBeTruthy();
  });
});
