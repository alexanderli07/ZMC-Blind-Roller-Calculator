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
- `@react-native-picker/picker` for the selection wheels/dropdowns
- `@react-native-async-storage/async-storage` to persist user-added items
  (the iOS version's "add" feature did not persist across restarts; this one does)

## Project layout

```
App.tsx                     Main screen (port of ContentView.swift)
src/
  types.ts                  FabricType / Tube / BottomBar models
  calculations.ts           weight, roller diameter, deflection formulas
  storage.ts                bundled defaults + persisted custom items
  data/
    fabricTypes.json        28 fabrics (g/m², mm)
    tubes.json              18 tubes (mm, in^4, PSI, lb/ft)
    bottomBars.json         11 bottom bars (g/m, lb/ft)
  components/
    ScrollablePicker.tsx
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
