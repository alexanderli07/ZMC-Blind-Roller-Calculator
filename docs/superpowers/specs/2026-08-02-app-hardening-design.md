# ZMC Blind Roller Calculator Hardening Design

## Goal

Make the existing Expo Go calculator reliable to develop, validate, test, and build without changing its intended formulas or visual layout.

## Scope

This hardening pass will:

- keep the project on Expo SDK 54 so it remains compatible with the current physical-device Expo Go workflow;
- align Expo, TypeScript, and React type packages with the versions expected by Expo SDK 54;
- replace silent fallback calculations with an explicit incomplete state;
- validate all user-defined material inputs before conversion or persistence;
- add automated calculation, conversion, validation, and component tests;
- add repeatable typecheck, lint, test, and aggregate check commands;
- correct the documented units used by tube calculations;
- add usable EAS preview and production build profiles; and
- update the README so its setup, testing, Expo Go, and build instructions match the repository.

The hardening pass will not change the established valid-input formulas, redesign the screen, add navigation, add a backend, or introduce native modules that are unavailable in Expo Go.

## Runtime Architecture

The app remains a single-screen Expo/React Native application. `App.tsx` owns selection and dimension state, loads default plus custom materials, and delegates numerical work to pure modules.

`src/calculations.ts` will stop supplying fallback materials and dimensions. A calculation will produce `null` unless all of the following are present and valid:

- a selected tube;
- a selected fabric;
- a selected bottom bar;
- a finite blind width greater than zero; and
- a finite blind height greater than zero.

Once inputs are complete, the existing weight, roller-diameter, and deflection formulas will run unchanged. The UI will format `null` results as an em dash. This puts the safety rule in the calculation boundary as well as the UI, preventing another caller from accidentally receiving a plausible-looking default result.

## Input Validation

A new pure validation module will define the rules used by the add-item modals. It will return either parsed values ready for conversion or a specific user-facing error.

All categories require a trimmed, nonempty name that is unique within the category when compared case-insensitively. Every numeric field must be finite and greater than zero. Tubes additionally require wall thickness to be less than half the outer diameter so the inner diameter remains positive.

`AddItemModal` will accept a validation callback, show its returned error inline, and submit only validated values. The modal will prevent repeated submissions while an asynchronous save is running and will surface persistence failures instead of producing an unhandled rejection. Valid names will be stored trimmed.

The main width and height inputs will keep their current decimal keyboards. Empty fields are neutral; nonempty invalid fields show concise inline guidance and leave every result as an em dash.

## Units and Data

Bundled material values and valid formulas remain unchanged. Tube documentation will reflect how the implementation actually consumes the fields:

- diameter and thickness: millimetres;
- moment of inertia: square inches to the fourth power (`in^4`);
- elasticity: pounds per square inch (PSI); and
- tube linear weight: pounds per foot (`lb/ft`).

The fixed tube elasticity constant remains unchanged because the bundled data currently uses the same value and the goal is hardening, not recalibration. Any future formula recalibration must be checked against the authoritative source spreadsheet as a separate change.

## Automated Testing and Static Checks

The project will use Jest with the `jest-expo` preset and React Native Testing Library, following Expo's supported React Native test path.

Pure tests will cover:

- the known 72-by-96-inch `1TU`/`deluxe`/`slim bottom bar` sample;
- pound/kilogram, inch/millimetre, and conversion relationships;
- incomplete, nonnumeric, zero, and negative dimensions returning no result;
- zero-height roller-diameter rejection;
- custom fabric, tube, and bottom-bar conversions;
- duplicate-name detection;
- invalid numeric values; and
- impossible tube wall thickness.

Component tests will verify that the results begin as em dashes and that complete valid selections and dimensions render the expected sample values. Native persistence and picker boundaries may be mocked, while the app's state transitions and real calculation functions remain under test.

The package scripts will expose:

- `npm test` for a deterministic single Jest run;
- `npm run test:watch` for local watch mode;
- `npm run typecheck` for `tsc --noEmit`;
- `npm run lint` for ESLint; and
- `npm run check` to run typecheck, lint, and tests in sequence.

ESLint will use Expo's flat configuration. TypeScript will stay strict and include Jest types.

## Expo and EAS Configuration

Expo SDK remains at major version 54. Dependencies will be installed through Expo's version-aware installer so the lockfile records versions compatible with that SDK.

`eas.json` will provide:

- a `preview` profile with internal distribution and an Android APK; and
- a `production` profile that produces the default Android App Bundle.

The README will use `npx eas-cli@latest` commands so a global EAS CLI installation is optional. Authentication and the remote EAS build itself are outside local verification because they require the project owner's Expo account.

## Error Handling

Invalid calculator dimensions never reach the formulas. Invalid custom materials never reach conversion or AsyncStorage. AsyncStorage read failures continue to degrade to bundled defaults, while write and clear failures are displayed in the active modal and leave it open for retry.

## Acceptance Criteria

- The initial and every incomplete calculator state displays em dashes for all three results.
- Valid complete inputs preserve the established numerical results to the displayed precision.
- Invalid or duplicate custom materials cannot be stored and receive a clear inline message.
- User-defined materials still persist and can still be removed by category.
- Expo dependency validation reports no version mismatches.
- Typecheck, lint, Jest tests, and Android production export all exit successfully.
- Expo Metro starts successfully for the physical-device Expo Go workflow.
- The README commands match the committed project paths and configuration.
