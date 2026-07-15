# ZMC Blind Roller Calculator — Android (Expo / React Native)

Android port of the iOS SwiftUI app. It calculates the total weight, rolled-up
roller diameter, and tube deflection for a roller blind. All formulas, defaults,
and data are ported from the original Swift code.

## Formulas

- **Total weight:** fabric sheet weight plus bottom-bar weight.
- **Roller diameter:** an Archimedean-spiral solve for the rolled fabric.
- **Total deflection:** point-load (blind weight) and distributed-load (tube
  self-weight) beam deflection.

## Stack

- [Expo](https://expo.dev/) (React Native) + TypeScript
- `@react-native-async-storage/async-storage` to persist user-added items and
  preferences (the iOS version's "add" feature did not persist across restarts;
  this one does)

## Project layout

```
App.tsx                     Providers and the app frame
src/
  types.ts                  FabricType / Tube / BottomBar models
  calculations.ts           weight, roller diameter, deflection formulas
  conversions.ts            "add item" inputs to stored spreadsheet units
  describe.ts               one-line spec summaries for the picker sheets
  format.ts                 unit system, conversion, display precision
  storage.ts                bundled defaults, custom items, export/import
  screens/
    CalculatorScreen.tsx    results, selectors, dimensions
    SettingsScreen.tsx      appearance, units, precision, tolerance, library
  settings/
    settings.tsx            preferences provider
    settingsStorage.ts      persisted preferences and last selection
  theme/
    theme.tsx               palettes, system resolution, provider
    themeStorage.ts         persisted appearance preference
    tokens.ts               spacing, radius, type scale, ZMC red
  data/
    fabricTypes.json        28 fabrics (g/m², mm)
    tubes.json              18 tubes (mm, in^4, PSI, lb/ft)
    bottomBars.json         11 bottom bars (g/m, lb/ft)
  components/
    ResultCard.tsx          headline roller-diameter readout
    StatTile.tsx            weight and deflection, with the limit chip
    SelectSheet.tsx         searchable picker with add and per-item delete
    CustomItemsSheet.tsx    manage everything the user has added
    DimensionsCard.tsx      width x height with the in/mm toggle
    SegmentedControl.tsx
    GearIcon.tsx            flat gear drawn from Views
    Section.tsx             captioned card group
    Row.tsx                 one line in a card group
    InputField.tsx
    AddItemModal.tsx        generic add-new-item modal (fabric/tube/bottom bar)
```

## Install and run with Expo Go

From the repository root:

```powershell
cd Android
npm.cmd ci
npm.cmd start
```

Install Expo Go on the Android phone, keep the phone and computer on the same Wi-Fi network, and scan the terminal QR code. If LAN discovery is blocked, run `npm.cmd start -- --tunnel`.

## Settings

The gear in the header opens the settings screen. Everything there is stored
locally and restored on the next launch.

- **Appearance** — System, Light, or Dark. The app follows the Android system
  setting on first install; choosing System resumes live appearance changes.
- **Units** — Imperial or Metric leads every readout, with an optional second
  unit alongside. The in/mm toggle on the dimensions card writes to the same
  setting, and switching converts what is already entered rather than
  reinterpreting it.
- **Decimal places** — set separately for weight, roller diameter, and
  deflection, because they do not warrant the same precision.
- **Max deflection** — the pass/fail threshold, 0.375 in by default. The
  deflection tile shows "Within limit" or "Over limit" against it.
- **Your library** — review and delete individual custom items, export them as
  JSON, import an export, or clear them all. Bundled defaults cannot be deleted.

For a manual smoke test, leave the app open in System mode and switch Android
between light and dark. Then select a manual override, reload Expo Go, confirm
the override persists, and return to System.

## Automated checks

```powershell
npm.cmd run check
```

Individual commands are `npm.cmd test`, `npm.cmd run test:watch`, `npm.cmd run typecheck`, and `npm.cmd run lint`.

## Manual calculation check

For `1TU`, `deluxe`, `slim bottom bar w/fab insert`, width `72`, and height `96`,
with every decimal-places setting raised to three, expect:

- `3.845 lb (1.744 kg)` total weight
- `1.574 in (39.975 mm)` roller diameter
- `0.127 in (3.223 mm)` tube deflection, within the 0.375 in limit

At the default precision those read `3.85 lb`, `1.57 in`, and `0.127 in`.

## Android builds with EAS

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build -p android --profile preview
npx.cmd eas-cli@latest build -p android --profile production
```

The preview profile produces an internally distributed APK. The production profile produces the default Play Store App Bundle.
