# ZMC Blind Roller Calculator — Android (Expo / React Native)

Android port of the iOS SwiftUI app. Calculates, for a roller blind:

- **Total Weight** (kg) — fabric sheet weight + bottom bar weight
- **Roller Diameter** (mm) — rolled-up fabric diameter via an Archimedean-spiral solve
- **Total Deflection** (mm) — point-load (blind weight) + distributed-load (tube self-weight) beam deflection

All formulas, defaults, and data are ported verbatim from the original Swift code.

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
    tubes.json              18 tubes (mm, cm^4, psi, kg/m)
    bottomBars.json         11 bottom bars (g/m, lb/ft)
  components/
    ScrollablePicker.tsx
    InputField.tsx
    AddItemModal.tsx        generic add-new-item modal (fabric/tube/bottom bar)
```

## Run it

```bash
cd "ZMC Blind Roller Calculator Android"
npm install

# Android emulator or device (requires Android Studio / a connected device):
npm run android

# Or scan the QR code with the Expo Go app:
npm start

# Or preview in a browser:
npm run web
```

## Build an installable APK / Play Store bundle

Use EAS Build (cloud, no Android Studio needed):

```bash
npm install -g eas-cli
eas build -p android --profile preview   # APK for testing
eas build -p android --profile production # AAB for the Play Store
```
