# Transparent Sheet Safe Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the underlying app visible and dimmed above every shared sheet while only the grabber, header, and sheet body animate.

**Architecture:** First restore the post-redesign test baseline so the sheet change starts from trustworthy gates. Then add Expo's SDK-compatible safe-area provider, read exact device insets inside the shared `DragSheet`, keep the backdrop fixed across the complete modal window, and absolutely position only the animated sheet surface below the top inset while padding through the bottom inset.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript, `Animated`, `PanResponder`, `react-native-safe-area-context ~5.6.0`, Jest 29, React Native Testing Library 14.

## Global Constraints

- The underlying app remains visible and dimmed in the status-bar or Dynamic Island area.
- Only the actual sheet surface may move during opening, dragging, snap-back, and closing.
- The sheet surface begins at the current top safe-area inset and its background continues through the bottom safe-area inset.
- Tube, fabric, bottom-bar, custom-items, and settings sheets inherit the behavior from the shared `DragSheet`.
- Preserve the current grab strip, swipe thresholds, velocity behavior, animation timing, synchronized dim opacity, close buttons, Android back handling, search, scrolling, selection, add/remove behavior, accessibility labels, and existing test IDs.
- Keep the full-screen dim overlay; do not replace the current PanResponder implementation or add a gesture library.
- Do not change sheet height, list layout, header design, calculator formulas, datasets, settings, persistence, theme choices, or add-item prompt modals.
- Install dependencies through Expo so SDK 54 selects `react-native-safe-area-context ~5.6.0`.
- iPhone Expo Go and Android verification must show no system-UI overlap.

---

### Task 1: Restore the current redesign baseline

**Files:**
- Modify: `Android/__tests__/App.test.tsx`
- Modify: `Android/src/format.ts`
- Modify: `Android/src/components/DragSheet.tsx`

**Interfaces:**
- Consumes: React Native Testing Library 14's asynchronous `render()` result.
- Preserves: all calculator values, UI copy, sheet behavior, and public formatter signatures.
- Produces: a clean typecheck, lint run, and 100-test Jest baseline for Task 2.

- [ ] **Step 1: Reproduce the existing baseline failures**

Run from `Android`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --runTestsByPath __tests__/App.test.tsx __tests__/format.test.ts
```

Expected RED evidence:

- TypeScript reports that `chooseEverything` receives the resolved render result but is typed as the unresolved `Promise`.
- Lint reports the unused `space` import in `src/components/DragSheet.tsx`.
- App tests fail because string `toHaveTextContent` assertions compare against the full combined card text.
- `lengthLabel(0.375, 'metric', 2)` returns `9.52 mm` because binary floating-point places `9.525` just below the decimal half boundary.

- [ ] **Step 2: Correct the asynchronous render-result type**

In `Android/__tests__/App.test.tsx`, replace the helper signature with:

```ts
async function chooseEverything(screen: Awaited<ReturnType<typeof render>>) {
```

Do not change the helper body.

- [ ] **Step 3: Make intentional substring assertions explicit**

In `Android/__tests__/App.test.tsx`, replace the affected assertions with regular expressions so each assertion checks the requested reading inside its labelled result card:

```ts
expect(screen.getByTestId('total-weight-result')).toHaveTextContent(/—/);
expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent(/—/);
expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent(/—/);

await waitFor(() =>
  expect(screen.getByTestId('total-weight-result')).toHaveTextContent(/3\.845 lb/)
);
expect(screen.getByTestId('total-weight-result')).toHaveTextContent(/1\.744 kg/);

expect(diameter).toHaveTextContent(/1\.574 in/);
expect(diameter).toHaveTextContent(/39\.975 mm/);

expect(deflection).toHaveTextContent(/0\.127 in/);
expect(deflection).toHaveTextContent(/3\.223 mm/);

await waitFor(() =>
  expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent(/Within limit/)
);
expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent(/Max 0\.375 in/);

await waitFor(() =>
  expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent(/Over limit/)
);

expect(screen.getByTestId('total-weight-result')).toHaveTextContent(/—/);
```

These are replacements for the existing string assertions, not additional duplicate assertions.

- [ ] **Step 4: Apply decimal half-up rounding before fixed formatting**

In `Android/src/format.ts`, add this helper immediately after the `Part` interface:

```ts
function fixed(value: number, decimals: number): string {
  const scale = 10 ** decimals;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value));
  const rounded = Math.round((value + tolerance) * scale) / scale;
  return rounded.toFixed(decimals);
}
```

Replace the three formatter calls in `pick`:

```ts
return {
  value: fixed(primary.value, decimals),
  unit: primary.unit,
  secondary: showSecondary ? `${fixed(other.value, decimals)} ${other.unit}` : null,
};
```

Replace the return in `lengthLabel`:

```ts
return `${fixed(shown, decimals)} ${unitSuffix(system)}`;
```

This keeps the existing public API and makes the already-written `9.53 mm` expectation pass without changing the requested precision.

- [ ] **Step 5: Remove the existing lint warning**

In `Android/src/components/DragSheet.tsx`, change:

```ts
import { radius, space } from '../theme/tokens';
```

to:

```ts
import { radius } from '../theme/tokens';
```

- [ ] **Step 6: Verify the repaired baseline**

Run from `Android`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --runTestsByPath __tests__/App.test.tsx __tests__/format.test.ts
npm.cmd run check
```

Expected GREEN evidence:

- Typecheck exits 0.
- Lint exits 0 with no warning from `DragSheet.tsx`.
- The focused App and formatter suites pass.
- All 11 current suites and all 100 current tests pass. The known core `SafeAreaView` deprecation output may remain until Task 2 removes it from `DragSheet`; root-frame migration is not part of this feature.

- [ ] **Step 7: Commit the baseline repair**

```powershell
git add Android/__tests__/App.test.tsx Android/src/format.ts Android/src/components/DragSheet.tsx
git diff --cached --check
git commit -m "fix: restore redesigned app checks"
```

---

### Task 2: Animate only the safe-area-aware sheet surface

**Files:**
- Modify via Expo: `Android/package.json`
- Modify via Expo: `Android/package-lock.json`
- Create: `Android/jest.setup.ts`
- Modify: `Android/App.tsx`
- Modify: `Android/src/components/DragSheet.tsx`
- Create: `Android/__tests__/DragSheet.test.tsx`

**Interfaces:**
- Consumes: `SafeAreaProvider`, `initialWindowMetrics`, and `useSafeAreaInsets()` from `react-native-safe-area-context ~5.6.0`.
- Preserves: the existing `DragSheet` props and every current consumer.
- Adds for tests: `${testID}-modal` and `${testID}-backdrop` while retaining `testID` on the animated surface and `${testID}-grabber` on the drag strip.
- Produces: a fixed, full-window dim backdrop and an animated surface styled with `{ top: insets.top, paddingBottom: insets.bottom }`.

- [ ] **Step 1: Install the Expo-compatible safe-area dependency**

Run from `Android`:

```powershell
npx.cmd expo install react-native-safe-area-context
```

Expected: exit 0; `package.json` records `react-native-safe-area-context` at Expo SDK 54's compatible `~5.6.0` range and `package-lock.json` updates accordingly.

- [ ] **Step 2: Add a deterministic Jest safe-area mock**

Create `Android/jest.setup.ts`:

```ts
import type { ReactNode } from 'react';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
  initialWindowMetrics: null,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
}));
```

Update the existing `jest` section in `Android/package.json` to:

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": [
    "<rootDir>/jest.setup.ts"
  ]
}
```

- [ ] **Step 3: Write the failing structural safe-area tests**

Create `Android/__tests__/DragSheet.test.tsx`:

```tsx
import { Modal, Text } from 'react-native';
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

  const modal = view.UNSAFE_getByType(Modal);
  expect(modal.props).toMatchObject({
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
```

- [ ] **Step 4: Run the new tests and verify RED**

Run from `Android`:

```powershell
npm.cmd test -- --runTestsByPath __tests__/DragSheet.test.tsx
```

Expected: FAIL because `DragSheet` does not render `test-sheet-backdrop`, its animated surface still fills the window through `SafeAreaView`, and the modal lacks the translucent-system-bar presentation props.

- [ ] **Step 5: Provide initial safe-area metrics at the app root**

In `Android/App.tsx`, add:

```ts
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
```

Replace the exported component with:

```tsx
export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <SettingsProvider>
          <Frame />
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

Keep the current `Frame`, Expo status-bar behavior, and root `SafeAreaView` unchanged.

- [ ] **Step 6: Separate the fixed backdrop from the animated surface**

In `Android/src/components/DragSheet.tsx`, replace the React Native imports with:

```ts
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

Immediately after creating `styles`, read the current insets:

```ts
const insets = useSafeAreaInsets();
```

Replace the current modal return block with:

```tsx
return (
  <Modal
    visible={mounted}
    transparent
    animationType="none"
    presentationStyle="overFullScreen"
    statusBarTranslucent
    navigationBarTranslucent
    onShow={runEntrance}
    onRequestClose={onClose}
    testID={testID ? `${testID}-modal` : undefined}
  >
    <View style={styles.fill}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        testID={testID ? `${testID}-backdrop` : undefined}
      />
      <Animated.View
        style={[
          styles.screen,
          {
            top: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateY }],
          },
        ]}
        testID={testID}
      >
        <View style={styles.chrome}>
          <View
            accessibilityRole="adjustable"
            accessibilityLabel="Drag down to close"
            style={styles.grabStrip}
            testID={testID ? `${testID}-grabber` : undefined}
            {...responderRef.current.panHandlers}
          >
            <View style={styles.grabber} />
          </View>
          {header}
        </View>
        {children}
      </Animated.View>
    </View>
  </Modal>
);
```

Replace `screen` and remove the unused `safe` style:

```ts
screen: {
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: colors.background,
},
```

Do not change `translateY`, `backdropOpacity`, the responder, animation durations, dismissal thresholds, or any header/body component.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run from `Android`:

```powershell
npm.cmd test -- --runTestsByPath __tests__/DragSheet.test.tsx __tests__/ThemedControls.test.tsx __tests__/App.test.tsx
```

Expected: the two new DragSheet tests and all existing sheet/App tests pass. The DragSheet `SafeAreaView` deprecation warning is gone; the unchanged root-frame warning may remain.

- [ ] **Step 8: Run automated release gates**

Run from `Android`:

```powershell
npm.cmd run check
npx.cmd expo install --check
```

Expected:

- Typecheck and lint exit 0.
- All 12 suites and all 102 tests pass.
- Expo reports `Dependencies are up to date`.

Export Android to an exact temporary directory and remove only that verified directory:

```powershell
$sheetExport = Join-Path $env:TEMP 'zmc-transparent-sheet-export'
$resolvedSheetExport = [IO.Path]::GetFullPath($sheetExport)
$resolvedTempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
if (-not $resolvedSheetExport.StartsWith($resolvedTempRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Export path escaped TEMP: $resolvedSheetExport"
}
if (Test-Path -LiteralPath $resolvedSheetExport) {
  Remove-Item -LiteralPath $resolvedSheetExport -Recurse -Force
}
npx.cmd expo export --platform android --clear --output-dir $resolvedSheetExport
Get-ChildItem -LiteralPath $resolvedSheetExport -Recurse
Remove-Item -LiteralPath $resolvedSheetExport -Recurse -Force
if (Test-Path -LiteralPath $resolvedSheetExport) {
  throw "Temporary export was not removed: $resolvedSheetExport"
}
```

Expected: Android export exits 0, produces the Hermes bundle/assets/metadata, and the exact temporary directory is absent afterward.

- [ ] **Step 9: Perform physical sheet verification**

Start Expo with a clean Metro cache from `Android`:

```powershell
npm.cmd start -- --clear
```

On iPhone Expo Go, open tube, fabric, bottom-bar, custom-items, and settings sheets and verify:

1. The Dynamic Island/status-bar area shows the dimmed underlying app, not a solid sheet background.
2. The top system area stays stationary while the grabber/header/body opens, drags, snaps back, and closes.
3. The sheet background covers the home-indicator area.
4. Search, scrolling, selection, buttons, and swipe-down dismissal still work.

Repeat on an Android device or emulator and verify the same behavior around the status and navigation bars with no overlap.

Stop only the Metro process started for this verification after the device checks finish.

- [ ] **Step 10: Commit the safe-area sheet fix**

```powershell
git add Android/package.json Android/package-lock.json Android/jest.setup.ts Android/App.tsx Android/src/components/DragSheet.tsx Android/__tests__/DragSheet.test.tsx
git diff --cached --check
git commit -m "fix: keep sheet safe area transparent"
```

- [ ] **Step 11: Verify final repository state**

Run from the repository root:

```powershell
git diff --check
git status --short --branch
git log -3 --oneline
```

Expected: no whitespace errors, a clean `fix/transparent-sheet-safe-area` worktree, and separate commits for the baseline repair and sheet fix after the approved design/plan commits.
