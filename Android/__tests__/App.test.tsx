import { fireEvent, render, waitFor } from '@testing-library/react-native';
import App from '../App';
import * as storage from '../src/storage';
import fabrics from '../src/data/fabricTypes.json';
import tubes from '../src/data/tubes.json';
import bottomBars from '../src/data/bottomBars.json';

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

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
});
