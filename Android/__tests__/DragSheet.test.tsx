import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DragSheet from '../src/components/DragSheet';
import { lightPalette, ThemeProvider } from '../src/theme/theme';
import * as themeStorage from '../src/theme/themeStorage';

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

const DEVICE_INSETS = { top: 59, right: 0, bottom: 34, left: 0 };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSafeAreaInsets).mockReturnValue(DEVICE_INSETS);
  jest.mocked(themeStorage.loadThemePreference).mockResolvedValue('light');
  jest.mocked(themeStorage.saveThemePreference).mockResolvedValue(true);
});

async function renderSheet() {
  return render(
    <ThemeProvider>
      <DragSheet
        visible
        onClose={jest.fn()}
        header={<Text>Header</Text>}
        testID="test-sheet"
      >
        <Text>Body</Text>
      </DragSheet>
    </ThemeProvider>
  );
}

test('keeps the backdrop fixed and moves only the inset sheet surface', async () => {
  const view = await renderSheet();
  const sheet = await view.findByTestId('test-sheet');

  expect(sheet).toHaveStyle({
    position: 'absolute',
    top: DEVICE_INSETS.top,
    right: 0,
    bottom: 0,
    left: 0,
    paddingBottom: DEVICE_INSETS.bottom,
    backgroundColor: lightPalette.background,
  });
  expect(view.getByTestId('test-sheet-backdrop')).toHaveStyle({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: lightPalette.overlay,
  });
});

test('presents over system bars while preserving the grabber contract', async () => {
  const view = await renderSheet();
  await waitFor(() => expect(view.getByTestId('test-sheet')).toBeTruthy());

  const modal = view.container.queryAll(({ type }) => type === 'Modal')[0];
  expect(modal).toBeDefined();
  expect(modal!.props).toMatchObject({
    transparent: true,
    animationType: 'none',
    presentationStyle: 'overFullScreen',
    statusBarTranslucent: true,
    navigationBarTranslucent: true,
  });
  expect(view.getByTestId('test-sheet-grabber').props).toMatchObject({
    accessibilityRole: 'adjustable',
    accessibilityLabel: 'Drag down to close',
  });
});
