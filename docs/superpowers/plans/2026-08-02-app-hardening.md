# ZMC Blind Roller Calculator Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Expo Go calculator reject incomplete or invalid inputs, verify its numerical and UI behavior automatically, and provide repeatable local and EAS workflows.

**Architecture:** Keep the single-screen Expo application and existing valid-input formulas. Put shared positive-number and custom-item validation in a pure module, make every public calculation return `null` until inputs are complete, and keep modal async/error behavior inside the reusable modal component. Use Jest plus React Native Testing Library for pure and component tests.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, Jest with `jest-expo`, React Native Testing Library, ESLint with `eslint-config-expo`, AsyncStorage, EAS Build.

## Global Constraints

- Remain on Expo SDK 54 and preserve physical-device Expo Go compatibility.
- Preserve all established valid-input formulas and displayed precision.
- Display an em dash for every result until tube, fabric, bottom bar, positive width, and positive height are present.
- Reject nonfinite, zero, negative, duplicate-name, and impossible tube inputs before persistence.
- Keep the existing single-screen layout and do not add navigation, a backend, or unsupported Expo Go native modules.
- Treat tube moment, elasticity, and linear weight as `in^4`, PSI, and `lb/ft` respectively.
- Use test-first red-green cycles for every production behavior change.

---

## File Map

- `Android/src/validation.ts`: pure positive-number and category-specific custom-item validation.
- `Android/src/calculations.ts`: nullable calculation boundary and unchanged complete-input formulas.
- `Android/src/components/AddItemModal.tsx`: generic validated async submit/remove flow and inline errors.
- `Android/src/components/InputField.tsx`: optional inline error and stable test identifier.
- `Android/src/components/ScrollablePicker.tsx`: stable picker test identifier.
- `Android/App.tsx`: validation wiring, nullable-result rendering, and storage error propagation.
- `Android/__tests__/calculations.test.ts`: formula and incomplete-input regression coverage.
- `Android/__tests__/conversions.test.ts`: custom-item conversion regression coverage.
- `Android/__tests__/validation.test.ts`: validation rules.
- `Android/__tests__/storage.test.ts`: custom-item persistence and category clearing.
- `Android/__tests__/AddItemModal.test.tsx`: modal validation and async failure behavior.
- `Android/__tests__/App.test.tsx`: initial placeholders and complete sample UI behavior.
- `Android/eslint.config.js`: Expo flat ESLint configuration.
- `Android/eas.json`: preview APK and production AAB profiles.
- `Android/package.json`, `Android/package-lock.json`, `Android/tsconfig.json`: compatible dependencies and repeatable scripts.
- `Android/src/types.ts`, `Android/README.md`: corrected units and operating instructions.

---

### Task 1: Align Expo Tooling and Add the Test Harness

**Files:**
- Modify: `Android/package.json`
- Modify: `Android/package-lock.json`
- Modify: `Android/tsconfig.json`
- Create: `Android/eslint.config.js`

**Interfaces:**
- Consumes: Expo SDK 54 version metadata.
- Produces: `npm test`, `npm run test:watch`, `npm run typecheck`, `npm run lint`, and `npm run check`.

- [ ] **Step 1: Align the SDK-managed packages**

Run from `Android`:

```powershell
npx.cmd expo install expo@~54.0.36
npx.cmd expo install typescript@~5.9.2 "@types/react@~19.1.10" "--" --save-dev
```

Expected: `package.json` and `package-lock.json` use Expo `~54.0.36`, TypeScript `~5.9.2`, and React types `~19.1.10` without changing React Native 0.81 or React 19.1.

- [ ] **Step 2: Install Expo's supported test and lint dependencies**

Run:

```powershell
npx.cmd expo install jest-expo jest @types/jest @testing-library/react-native eslint eslint-config-expo "--" --save-dev
```

Expected: compatible dev dependencies are recorded in the lockfile.

- [ ] **Step 3: Add deterministic scripts and the Jest preset**

Update `Android/package.json` so the scripts and Jest sections contain:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "lint": "expo lint",
    "check": "npm run typecheck && npm run lint && npm test"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

Preserve the existing package name, version, entry point, dependencies, dev dependencies, and `private` flag.

- [ ] **Step 4: Enable Jest types without weakening strict TypeScript**

Replace `Android/tsconfig.json` with:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "resolveJsonModule": true,
    "types": ["jest"]
  }
}
```

- [ ] **Step 5: Add Expo's flat ESLint configuration**

Create `Android/eslint.config.js`:

```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'web-build/*'],
  },
]);
```

- [ ] **Step 6: Verify the harness itself**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Expected: both commands exit 0. `npm test` may exit 1 with “No tests found” until Task 2, which is acceptable at this setup boundary.

- [ ] **Step 7: Commit the tooling foundation**

```powershell
git add Android/package.json Android/package-lock.json Android/tsconfig.json Android/eslint.config.js
git commit -m "chore: align Expo tooling and add checks"
```

---

### Task 2: Reject Incomplete Calculator Inputs Without Changing Valid Results

**Files:**
- Create: `Android/__tests__/calculations.test.ts`
- Create: `Android/__tests__/App.test.tsx`
- Modify: `Android/src/calculations.ts`
- Modify: `Android/App.tsx`

**Interfaces:**
- Consumes: `CalcInputs` with optional material objects and string dimensions.
- Produces: `parsePositiveNumber(value: string): number | null`, nullable public calculation functions returning `number | null`, and em-dash result rendering for `null`.

- [ ] **Step 1: Write exact-result and incomplete-input tests**

Create `Android/__tests__/calculations.test.ts`:

```ts
import {
  CalcInputs,
  parsePositiveNumber,
  rollerDiameterInch,
  rollerDiameterMm,
  totalWeightKg,
  totalWeightLb,
  tubeDeflectionInch,
  tubeDeflectionMm,
} from '../src/calculations';
import fabrics from '../src/data/fabricTypes.json';
import tubes from '../src/data/tubes.json';
import bottomBars from '../src/data/bottomBars.json';

const completeInputs: CalcInputs = {
  tube: tubes[0],
  fabric: fabrics[0],
  bottomBar: bottomBars[0],
  blindWidth: '72',
  blindHeight: '96',
};

describe('calculator input boundary', () => {
  test.each(['', 'abc', '0', '-1', 'Infinity'])('rejects width %p', (blindWidth) => {
    expect(totalWeightKg({ ...completeInputs, blindWidth })).toBeNull();
    expect(rollerDiameterMm({ ...completeInputs, blindWidth })).toBeNull();
    expect(tubeDeflectionMm({ ...completeInputs, blindWidth })).toBeNull();
  });

  test.each(['', 'abc', '0', '-1', 'Infinity'])('rejects height %p', (blindHeight) => {
    expect(totalWeightKg({ ...completeInputs, blindHeight })).toBeNull();
    expect(rollerDiameterMm({ ...completeInputs, blindHeight })).toBeNull();
    expect(tubeDeflectionMm({ ...completeInputs, blindHeight })).toBeNull();
  });

  test.each([
    ['tube', { tube: undefined }],
    ['fabric', { fabric: undefined }],
    ['bottom bar', { bottomBar: undefined }],
  ])('rejects a missing %s', (_label, missing) => {
    const inputs = { ...completeInputs, ...missing };
    expect(totalWeightKg(inputs)).toBeNull();
    expect(rollerDiameterMm(inputs)).toBeNull();
    expect(tubeDeflectionMm(inputs)).toBeNull();
  });

  test('parses only finite positive numbers', () => {
    expect(parsePositiveNumber(' 12.5 ')).toBe(12.5);
    expect(parsePositiveNumber('')).toBeNull();
    expect(parsePositiveNumber('0')).toBeNull();
    expect(parsePositiveNumber('-2')).toBeNull();
    expect(parsePositiveNumber('Infinity')).toBeNull();
  });
});

describe('known 72 by 96 inch sample', () => {
  test('preserves weight, diameter, and deflection', () => {
    expect(totalWeightLb(completeInputs)).toBeCloseTo(3.8451846784, 8);
    expect(totalWeightKg(completeInputs)).toBeCloseTo(1.7441485056, 8);
    expect(rollerDiameterInch(completeInputs)).toBeCloseTo(1.5738253869, 8);
    expect(rollerDiameterMm(completeInputs)).toBeCloseTo(39.9752447785, 8);
    expect(tubeDeflectionInch(completeInputs)).toBeCloseTo(0.1269037064, 8);
    expect(tubeDeflectionMm(completeInputs)).toBeCloseTo(3.2233605892, 8);
  });
});
```

- [ ] **Step 2: Write the failing initial-placeholder component test**

Create `Android/__tests__/App.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('../src/storage', () => ({
  loadFabricTypes: jest.fn(async () => []),
  loadTubes: jest.fn(async () => []),
  loadBottomBars: jest.fn(async () => []),
  addFabricType: jest.fn(),
  addTube: jest.fn(),
  addBottomBar: jest.fn(),
  clearFabricTypes: jest.fn(),
  clearTubes: jest.fn(),
  clearBottomBars: jest.fn(),
}));

test('starts with placeholders instead of fallback calculations', () => {
  const screen = render(<App />);
  expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
  expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('—');
  expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('—');
});
```

- [ ] **Step 3: Run both tests and verify the intended red state**

```powershell
npm.cmd test -- calculations.test.ts App.test.tsx
```

Expected: FAIL because `parsePositiveNumber` and result test identifiers are absent and existing calculations return fallback numbers instead of `null`.

- [ ] **Step 4: Implement one complete-input resolver and nullable calculations**

Refactor `Android/src/calculations.ts` around these exact internal types and boundary functions:

```ts
export interface CalcInputs {
  tube?: Tube;
  fabric?: FabricType;
  bottomBar?: BottomBar;
  blindWidth: string;
  blindHeight: string;
}

interface ResolvedCalcInputs {
  tube: Tube;
  fabric: FabricType;
  bottomBar: BottomBar;
  widthIn: number;
  heightIn: number;
}

export function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveInputs(inputs: CalcInputs): ResolvedCalcInputs | null {
  const widthIn = parsePositiveNumber(inputs.blindWidth);
  const heightIn = parsePositiveNumber(inputs.blindHeight);
  if (!inputs.tube || !inputs.fabric || !inputs.bottomBar || widthIn === null || heightIn === null) {
    return null;
  }
  return {
    tube: inputs.tube,
    fabric: inputs.fabric,
    bottomBar: inputs.bottomBar,
    widthIn,
    heightIn,
  };
}
```

Make each public calculation return `number | null`, resolve once, and use only resolved values. Preserve these formulas exactly:

```ts
function calculateTotalWeightKg(inputs: ResolvedCalcInputs): number {
  const widthMm = inputs.widthIn * 25.4;
  const heightMm = inputs.heightIn * 25.4;
  const fabricKg = ((inputs.fabric.weight * widthMm / 1000) * (heightMm / 1000)) / 1000;
  const bottomBarKg = (inputs.bottomBar.weightGM * widthMm / 1000) / 1000;
  return fabricKg + bottomBarKg;
}

export function totalWeightKg(inputs: CalcInputs): number | null {
  const resolved = resolveInputs(inputs);
  return resolved ? calculateTotalWeightKg(resolved) : null;
}
```

Use `calculateTotalWeightKg(resolved)` inside point deflection, retain the existing quadratic diameter solve, and retain the existing point-load plus distributed-load equations. Conversion wrappers must return `null` when their millimetre or kilogram source is `null`.

- [ ] **Step 5: Render nullable results so the application remains type-safe**

For each result in `Android/App.tsx`, test both paired values before formatting:

```tsx
<Text testID="total-weight-result" style={styles.resultValue}>
  {weightLb === null || weightKg === null ? (
    '—'
  ) : (
    <>
      {weightLb.toFixed(3)} lb{' '}
      <Text style={styles.resultSub}>({weightKg.toFixed(3)} kg)</Text>
    </>
  )}
</Text>
```

Apply the same structure and identifiers `roller-diameter-result` and `tube-deflection-result` to the other two rows.

- [ ] **Step 6: Run calculation and initial UI tests green**

```powershell
npm.cmd test -- calculations.test.ts App.test.tsx
```

Expected: all calculation cases and the initial placeholder component test pass.

- [ ] **Step 7: Run typecheck and commit**

```powershell
npm.cmd run typecheck
git add Android/src/calculations.ts Android/App.tsx Android/__tests__/calculations.test.ts Android/__tests__/App.test.tsx
git commit -m "fix: require complete calculator inputs"
```

Expected: typecheck exits 0 before the commit.

---

### Task 3: Validate Custom Materials Before Conversion

**Files:**
- Create: `Android/src/validation.ts`
- Create: `Android/__tests__/validation.test.ts`
- Create: `Android/__tests__/conversions.test.ts`
- Create: `Android/__tests__/storage.test.ts`
- Modify: `Android/src/types.ts`

**Interfaces:**
- Consumes: raw modal `Record<string, string>` values and existing category names.
- Produces: `ValidationResult<T>`, `FabricInput`, `TubeInput`, `BottomBarInput`, and three category validators.

- [ ] **Step 1: Write failing validation tests**

Create `Android/__tests__/validation.test.ts`:

```ts
import {
  validateBottomBarInput,
  validateFabricInput,
  validateTubeInput,
} from '../src/validation';

describe('custom item validation', () => {
  test('rejects an empty name', () => {
    expect(validateFabricInput(
      { name: '   ', weight: '12.5', thickness: '0.03' },
      []
    )).toEqual({ ok: false, error: 'Name is required.' });
  });

  test('trims and parses a valid fabric', () => {
    expect(validateFabricInput(
      { name: '  Solar  ', weight: '12.5', thickness: '0.03' },
      ['deluxe']
    )).toEqual({
      ok: true,
      value: { name: 'Solar', weight: 12.5, thickness: 0.03 },
    });
  });

  test('rejects duplicate names case-insensitively', () => {
    expect(validateFabricInput(
      { name: ' DELUXE ', weight: '12.5', thickness: '0.03' },
      ['deluxe']
    )).toEqual({ ok: false, error: 'An item with this name already exists.' });
  });

  test.each(['abc', '0', '-1', 'Infinity'])('rejects fabric weight %p', (weight) => {
    const result = validateFabricInput({ name: 'Solar', weight, thickness: '0.03' }, []);
    expect(result).toEqual({ ok: false, error: 'Weight must be a number greater than 0.' });
  });

  test('rejects tube thickness that removes the inner diameter', () => {
    expect(validateTubeInput(
      { name: 'Tube', diameter: '1.5', thickness: '0.75' },
      []
    )).toEqual({ ok: false, error: 'Thickness must be less than half the diameter.' });
  });

  test('rejects nonpositive fabric thickness', () => {
    expect(validateFabricInput(
      { name: 'Solar', weight: '12.5', thickness: '0' },
      []
    )).toEqual({ ok: false, error: 'Thickness must be a number greater than 0.' });
  });

  test('rejects a nonnumeric tube diameter', () => {
    expect(validateTubeInput(
      { name: 'Tube', diameter: 'wide', thickness: '0.05' },
      []
    )).toEqual({ ok: false, error: 'Diameter must be a number greater than 0.' });
  });

  test('parses a valid bottom bar', () => {
    expect(validateBottomBarInput(
      { name: 'Bar', weightLbFt: '0.4' },
      []
    )).toEqual({ ok: true, value: { name: 'Bar', weightLbFt: 0.4 } });
  });

  test('rejects nonpositive bottom-bar weight', () => {
    expect(validateBottomBarInput(
      { name: 'Bar', weightLbFt: '-0.4' },
      []
    )).toEqual({ ok: false, error: 'Weight must be a number greater than 0.' });
  });
});
```

- [ ] **Step 2: Run validation tests red**

```powershell
npm.cmd test -- validation.test.ts
```

Expected: FAIL because `src/validation.ts` does not exist.

- [ ] **Step 3: Implement the typed validation module**

Create `Android/src/validation.ts` with these public contracts:

```ts
import { parsePositiveNumber } from './calculations';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface FabricInput {
  name: string;
  weight: number;
  thickness: number;
}

export interface TubeInput {
  name: string;
  diameter: number;
  thickness: number;
}

export interface BottomBarInput {
  name: string;
  weightLbFt: number;
}
```

Implement a private name validator that trims the name, rejects empty names with `Name is required.`, and rejects case-insensitive matches with `An item with this name already exists.`. Implement numeric parsing through `parsePositiveNumber` and use the field-specific messages asserted above. `validateTubeInput` must reject `thickness >= diameter / 2` with `Thickness must be less than half the diameter.`.

- [ ] **Step 4: Run validation tests green**

```powershell
npm.cmd test -- validation.test.ts
```

Expected: all validation tests pass.

- [ ] **Step 5: Add conversion regression tests**

Create `Android/__tests__/conversions.test.ts`:

```ts
import {
  bottomBarFromInputs,
  fabricFromInputs,
  tubeFromInputs,
} from '../src/conversions';

describe('custom item conversions', () => {
  test('converts fabric imperial inputs', () => {
    expect(fabricFromInputs('Solar', 12, 0.02)).toEqual({
      name: 'Solar',
      weight: 406.872,
      thickness: 0.508,
    });
  });

  test('converts a 1.5 by 0.055 inch tube', () => {
    const tube = tubeFromInputs('Tube', 1.5, 0.055);
    expect(tube.diameter).toBeCloseTo(38.1, 10);
    expect(tube.thickness).toBeCloseTo(1.397, 10);
    expect(tube.moment).toBeCloseTo(0.065261, 5);
    expect(tube.weight).toBeCloseTo(0.29198, 4);
  });

  test('converts bottom-bar linear weight', () => {
    expect(bottomBarFromInputs('Bar', 0.4)).toEqual({
      name: 'Bar',
      weightLbFt: 0.4,
      weightGM: 595.264,
    });
  });
});
```

- [ ] **Step 6: Run conversion tests and correct unit comments**

```powershell
npm.cmd test -- conversions.test.ts
```

Expected: all conversion tests pass against existing behavior.

Update only the `Tube` comments in `Android/src/types.ts`:

```ts
export interface Tube {
  name: string;
  diameter: number; // mm
  thickness?: number | null; // mm
  moment: number; // in^4
  elasticity: number; // psi
  weight: number; // lb/ft
}
```

- [ ] **Step 7: Add persistence regression coverage**

Create `Android/__tests__/storage.test.ts`:

```ts
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addFabricType,
  clearFabricTypes,
  loadFabricTypes,
} from '../src/storage';

const customFabric = { name: 'Solar', weight: 400, thickness: 0.5 };

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('persists a custom item alongside bundled defaults', async () => {
  await addFabricType(customFabric);
  await expect(loadFabricTypes()).resolves.toContainEqual(customFabric);
});

test('clears custom items without removing bundled defaults', async () => {
  await addFabricType(customFabric);
  const fabrics = await clearFabricTypes();
  expect(fabrics).not.toContainEqual(customFabric);
  expect(fabrics.length).toBeGreaterThan(0);
});
```

Run:

```powershell
npm.cmd test -- storage.test.ts
```

Expected: both persistence regression tests pass against the existing storage implementation.

- [ ] **Step 8: Run focused checks and commit**

```powershell
npm.cmd test -- validation.test.ts conversions.test.ts calculations.test.ts storage.test.ts
npm.cmd run typecheck
git add Android/src/validation.ts Android/src/types.ts Android/__tests__/validation.test.ts Android/__tests__/conversions.test.ts Android/__tests__/storage.test.ts
git commit -m "feat: validate custom material inputs"
```

Expected: all focused tests and typecheck exit 0.

---

### Task 4: Make the Add Modal Validate and Surface Async Failures

**Files:**
- Create: `Android/__tests__/AddItemModal.test.tsx`
- Modify: `Android/src/components/AddItemModal.tsx`
- Modify: `Android/App.tsx`

**Interfaces:**
- Consumes: `validate(values): ValidationResult<T>`, category validators from Task 3, async-capable `onSubmit(value)`, and async-capable `onRemoveAll()`.
- Produces: a generic `AddItemModal<T>` that renders validation/storage errors and blocks repeated submissions.

- [ ] **Step 1: Write modal behavior tests**

Create `Android/__tests__/AddItemModal.test.tsx`:

```tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AddItemModal from '../src/components/AddItemModal';

const fields = [{ key: 'name', label: 'Name', numeric: false }];

describe('<AddItemModal />', () => {
  test('shows a validation error without submitting', () => {
    const onSubmit = jest.fn();
    const screen = render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: false, error: 'Invalid item.' })}
        onSubmit={onSubmit}
      />
    );
    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Bad');
    fireEvent.press(screen.getByText('Confirm'));
    expect(screen.getByText('Invalid item.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('keeps the modal open and shows a save failure', async () => {
    const screen = render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={jest.fn().mockRejectedValue(new Error('storage failed'))}
      />
    );
    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Item');
    fireEvent.press(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(screen.getByText('Could not save the item. Please try again.')).toBeTruthy();
    });
  });

  test('shows a remove failure', async () => {
    const screen = render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={jest.fn()}
        onRemoveAll={jest.fn().mockRejectedValue(new Error('storage failed'))}
      />
    );
    fireEvent.press(screen.getByText('Remove all user-defined items'));
    await waitFor(() => {
      expect(screen.getByText('Could not remove the items. Please try again.')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run modal tests red**

```powershell
npm.cmd test -- AddItemModal.test.tsx
```

Expected: FAIL because `validate` is not a supported prop and async failures are not rendered.

- [ ] **Step 3: Implement generic validated async behavior**

In `Android/src/components/AddItemModal.tsx`, import `ValidationResult`, make props generic, and use these contracts:

```ts
interface Props<T> {
  visible: boolean;
  title: string;
  fields: FieldSpec[];
  onCancel: () => void;
  validate: (values: Record<string, string>) => ValidationResult<T>;
  onSubmit: (value: T) => Promise<void> | void;
  onRemoveAll?: () => Promise<void> | void;
  removeAllLabel?: string;
}
```

Declare the component with the TSX-safe generic signature:

```tsx
export default function AddItemModal<T,>({
  visible,
  title,
  fields,
  onCancel,
  validate,
  onSubmit,
  onRemoveAll,
  removeAllLabel,
}: Props<T>) {
```

Add `error: string | null` and `submitting: boolean` state. Reset values, error, and submission state whenever the modal opens. The confirm handler must validate, display the validation error when `ok` is false, otherwise await `onSubmit`, and convert a rejection to `Could not save the item. Please try again.`. The remove handler must await `onRemoveAll` and convert a rejection to `Could not remove the items. Please try again.`. Disable both destructive/submit actions while `submitting` is true.

Render the error immediately above the button row:

```tsx
{error && <Text style={styles.errorText}>{error}</Text>}
```

Use this style:

```ts
errorText: {
  color: '#c0392b',
  fontSize: 14,
  marginTop: 4,
  textAlign: 'center',
},
```

- [ ] **Step 4: Wire parsed validation values to conversion and storage**

Import the three validators and their parsed types in `App.tsx`. Change add handlers to accept typed parsed objects:

```ts
const handleAddFabric = async (value: FabricInput) => {
  const updated = await addFabricType(
    fabricFromInputs(value.name, value.weight, value.thickness)
  );
  setFabricTypes(updated);
  setActiveModal(null);
};
```

Implement the tube and bottom-bar handlers with `TubeInput` and `BottomBarInput`. Pass each modal a validation closure using the current category names:

```tsx
validate={(values) =>
  validateFabricInput(values, fabricTypes.map((item) => item.name))
}
```

Use the matching tube and bottom-bar validators for the other two modals. Keep remove handlers async so rejected storage operations propagate to `AddItemModal`; close the modal only after a successful clear.

- [ ] **Step 5: Run modal tests green**

```powershell
npm.cmd test -- AddItemModal.test.tsx
```

Expected: 3 tests pass with no unhandled promise rejection.

- [ ] **Step 6: Run static checks and commit**

```powershell
npm.cmd run typecheck
npm.cmd run lint
git add Android/src/components/AddItemModal.tsx Android/App.tsx Android/__tests__/AddItemModal.test.tsx
git commit -m "feat: surface custom item validation errors"
```

Expected: typecheck and lint exit 0.

---

### Task 5: Add Complete-Input UI Coverage and Dimension Guidance

**Files:**
- Modify: `Android/__tests__/App.test.tsx`
- Modify: `Android/App.tsx`
- Modify: `Android/src/components/InputField.tsx`
- Modify: `Android/src/components/ScrollablePicker.tsx`

**Interfaces:**
- Consumes: nullable calculations from Task 2 and validated modal wiring from Task 4.
- Produces: inline dimension errors plus stable picker and input identifiers used by complete-sample component coverage.

- [ ] **Step 1: Expand the App test to cover loaded selections and dimensions**

Replace `Android/__tests__/App.test.tsx` with:

```tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import App from '../App';
import * as storage from '../src/storage';
import fabrics from '../src/data/fabricTypes.json';
import tubes from '../src/data/tubes.json';
import bottomBars from '../src/data/bottomBars.json';

jest.mock('../src/storage');

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(storage.loadFabricTypes).mockResolvedValue(fabrics);
  jest.mocked(storage.loadTubes).mockResolvedValue(tubes);
  jest.mocked(storage.loadBottomBars).mockResolvedValue(bottomBars);
});

describe('<App />', () => {
  test('starts with placeholders instead of fallback calculations', async () => {
    const screen = render(<App />);
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
    expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('—');
    expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('—');
    await waitFor(() => expect(storage.loadTubes).toHaveBeenCalled());
  });

  test('renders the known result after every input is complete', async () => {
    const screen = render(<App />);
    await waitFor(() => expect(screen.getByText('1TU')).toBeTruthy());

    fireEvent(screen.getByTestId('select-tube-picker'), 'valueChange', '1TU');
    fireEvent(screen.getByTestId('select-fabric-type-picker'), 'valueChange', 'deluxe');
    fireEvent(screen.getByTestId('select-bottom-bar-picker'), 'valueChange', 'slim bottom bar w/fab insert');
    fireEvent.changeText(screen.getByTestId('blind-width-input'), '72');
    fireEvent.changeText(screen.getByTestId('blind-height-input'), '96');

    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('3.845 lb (1.744 kg)');
    expect(screen.getByTestId('roller-diameter-result')).toHaveTextContent('1.574 in (39.975 mm)');
    expect(screen.getByTestId('tube-deflection-result')).toHaveTextContent('0.127 in (3.223 mm)');
  });

  test('shows dimension guidance for a nonpositive entered value', () => {
    const screen = render(<App />);
    fireEvent.changeText(screen.getByTestId('blind-width-input'), '0');
    expect(screen.getByText('Enter a number greater than 0.')).toBeTruthy();
    expect(screen.getByTestId('total-weight-result')).toHaveTextContent('—');
  });
});
```

- [ ] **Step 2: Run the expanded App tests red**

```powershell
npm.cmd test -- App.test.tsx
```

Expected: the existing placeholder test passes, while the new tests fail because picker/input identifiers and dimension errors do not exist.

- [ ] **Step 3: Add stable identifiers and optional input errors**

Extend `InputField` props with `error?: string` and `testID?: string`, pass `testID` to `TextInput`, and render:

```tsx
{error && <Text style={styles.error}>{error}</Text>}
```

with:

```ts
error: {
  color: '#c0392b',
  fontSize: 12,
  marginTop: 3,
},
```

In `ScrollablePicker`, derive a stable identifier from the title:

```ts
const testID = `${title.toLowerCase().replace(/\s+/g, '-')}-picker`;
```

Pass that value to the native `Picker`.

- [ ] **Step 4: Add dimension guidance without showing errors for blank fields**

Import `parsePositiveNumber` in `App.tsx` and derive errors only after the user has typed something:

```ts
const measurementError = (value: string) =>
  value.trim() !== '' && parsePositiveNumber(value) === null
    ? 'Enter a number greater than 0.'
    : undefined;
```

Pass `testID="blind-width-input"`, `testID="blind-height-input"`, and the corresponding errors to both `InputField` instances.

- [ ] **Step 5: Run component tests green**

```powershell
npm.cmd test -- App.test.tsx AddItemModal.test.tsx
```

Expected: 6 component tests pass.

- [ ] **Step 6: Run the full local check and commit**

```powershell
npm.cmd run check
git add Android/App.tsx Android/src/components/InputField.tsx Android/src/components/ScrollablePicker.tsx Android/__tests__/App.test.tsx
git commit -m "feat: show results only for valid inputs"
```

Expected: typecheck, lint, and all Jest tests exit 0.

---

### Task 6: Make EAS and Repository Documentation Match Reality

**Files:**
- Create: `Android/eas.json`
- Modify: `Android/README.md`

**Interfaces:**
- Consumes: committed scripts and current Expo app configuration.
- Produces: `preview` APK and `production` AAB EAS profiles plus exact operator instructions.

- [ ] **Step 1: Add explicit EAS profiles**

Create `Android/eas.json`:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

- [ ] **Step 2: Replace the README with verified project instructions**

Update `Android/README.md` to document:

````markdown
## Install and run with Expo Go

From the repository root:

```powershell
cd Android
npm.cmd ci
npm.cmd start
```

Install Expo Go on the Android phone, keep the phone and computer on the same Wi-Fi network, and scan the terminal QR code. If LAN discovery is blocked, run `npm.cmd start -- --tunnel`.

## Automated checks

```powershell
npm.cmd run check
```

Individual commands are `npm.cmd test`, `npm.cmd run test:watch`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

## Manual calculation check

For `1TU`, `deluxe`, `slim bottom bar w/fab insert`, width `72`, and height `96`, expect:

- `3.845 lb (1.744 kg)` total weight
- `1.574 in (39.975 mm)` roller diameter
- `0.127 in (3.223 mm)` tube deflection

## Android builds with EAS

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build -p android --profile preview
npx.cmd eas-cli@latest build -p android --profile production
```

The preview profile produces an internally distributed APK. The production profile produces the default Play Store App Bundle.
````

Retain the project overview, formulas, stack, and layout sections, but correct tube data units to `mm`, `in^4`, PSI, and `lb/ft` and remove the obsolete directory name and global EAS CLI requirement.

- [ ] **Step 3: Validate configuration and docs locally**

```powershell
Get-Content -Raw eas.json | ConvertFrom-Json | Out-Null
npx.cmd expo config --type public
rg -n "cd Android|npm.cmd run check|--profile preview|--profile production|in\^4|lb/ft" README.md
```

Expected: JSON parsing and Expo config exit 0; `rg` finds every required instruction.

- [ ] **Step 4: Commit configuration and documentation**

```powershell
git add Android/eas.json Android/README.md
git commit -m "docs: add verified Expo and EAS workflows"
```

---

### Task 7: Run Fresh End-to-End Verification

**Files:**
- Verify: all files changed by Tasks 1-6.

**Interfaces:**
- Consumes: the completed working tree.
- Produces: fresh evidence for dependencies, static checks, tests, Android bundling, and Metro startup.

- [ ] **Step 1: Verify dependency compatibility**

```powershell
npx.cmd expo install --check
```

Expected: `Dependencies are up to date` and exit 0.

- [ ] **Step 2: Run the aggregate quality gate**

```powershell
npm.cmd run check
```

Expected: TypeScript, ESLint, and every Jest suite pass with zero failures.

- [ ] **Step 3: Produce a clean Android Hermes bundle in a temporary directory**

Run from `Android`:

```powershell
$taskTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$taskExportDir = Join-Path $taskTempRoot ('zmc-expo-' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $taskExportDir | Out-Null
try {
  npx.cmd expo export --platform android --output-dir $taskExportDir
  if ($LASTEXITCODE -ne 0) { throw "Expo export failed with exit code $LASTEXITCODE" }
} finally {
  $resolvedExportDir = [System.IO.Path]::GetFullPath($taskExportDir)
  if ($resolvedExportDir.StartsWith($taskTempRoot) -and ([System.IO.Path]::GetFileName($resolvedExportDir)).StartsWith('zmc-expo-')) {
    Remove-Item -LiteralPath $resolvedExportDir -Recurse -Force
  } else {
    throw "Refusing cleanup outside the temporary directory: $resolvedExportDir"
  }
}
```

Expected: Metro reports `Android Bundled`, produces one Hermes `.hbc` bundle, and exits 0 before validated cleanup.

- [ ] **Step 4: Confirm Metro starts for Expo Go**

```powershell
npx.cmd expo start --offline --port 8099
```

Expected within 15 seconds: `Starting Metro Bundler` and `Waiting on http://localhost:8099`. Stop the process after observing those lines and confirm no listener remains on port 8099.

- [ ] **Step 5: Review the exact change set and repository state**

```powershell
git diff 0c30edb..HEAD --check
git status --short
git log -6 --oneline
```

Expected: no whitespace errors, no uncommitted source changes, and the design/tooling/calculation/validation/UI/docs commits are visible.

- [ ] **Step 6: Compare implementation against the specification acceptance criteria**

Read `docs/superpowers/specs/2026-08-02-app-hardening-design.md` and record evidence for each acceptance criterion from Steps 1-5. Do not mark the work complete if any criterion lacks direct evidence.
