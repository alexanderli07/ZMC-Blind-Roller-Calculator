# System Theme and Appearance Override Design

**Date:** 2026-08-03
**Status:** Approved

## Goal

Make the Android app follow the device light/dark setting by default while allowing the user to persist a `System`, `Light`, or `Dark` override from an in-app settings modal.

The change affects presentation only. Calculator formulas, client datasets, custom items, and storage formats for calculator data remain unchanged.

## User Experience

- A fresh installation defaults to `System`.
- `System` resolves to Android's current light/dark setting and responds while the app is open when that setting changes.
- A gear button in the main header opens an Appearance settings modal.
- The modal offers exactly three choices: `System`, `Light`, and `Dark`.
- Selecting a choice applies it immediately.
- A successful save closes the modal and the choice persists across app restarts.
- If saving fails, the selected appearance remains active for the current session, the modal stays open, and an inline message explains that the preference could not be saved.
- The gear button and all three choices expose accessible labels, roles, and selected state.

## Chosen Architecture

Use a React theme context backed by AsyncStorage.

This is preferred over passing a palette through every component because the app already has several independently rendered controls and modals. It is also preferred over native dynamic colors alone because native colors do not provide the required persistent Light/Dark override cleanly across all current components.

### Theme provider

Create a focused theme module that exports:

- `ThemePreference = 'system' | 'light' | 'dark'`
- `ResolvedTheme = 'light' | 'dark'`
- Light and dark color palettes.
- A pure resolver that combines a preference with React Native's system color scheme.
- `ThemeProvider`, which reads `useColorScheme()`, loads the stored preference, and exposes the current preference, resolved theme, colors, save error, and an asynchronous preference setter.
- `useTheme()`, which prevents consumers from using the context outside the provider.

`App` will render the calculator screen inside `ThemeProvider`. The initial in-memory preference is `system`, so first paint follows the current Android setting without waiting for storage. A stored override may replace it after AsyncStorage loads. The app will not hold the splash screen while loading this small preference.

### Preference storage

Create a theme-specific storage module rather than mixing appearance concerns into calculator-item storage.

- AsyncStorage key: `appearance_preference`
- Only `system`, `light`, and `dark` are accepted when loading.
- Missing, malformed, or unreadable data resolves to `system`.
- Saving returns success or failure to the provider without throwing into the UI.

### Appearance modal

Create a dedicated `AppearanceModal` component. It contains:

- A themed modal surface and backdrop.
- A title of `Appearance`.
- Three full-width selectable rows for `System`, `Light`, and `Dark`.
- A visible selected indicator and `accessibilityState={{ selected: true }}` on the current choice.
- An inline persistence error when saving fails.
- A Cancel button that closes the modal without changing the current preference.

The component does not own persistence. It receives the current preference and an asynchronous selection callback from the theme provider, keeping storage and UI responsibilities separate.

## Color System

All hard-coded runtime UI colors move into semantic palette tokens. Existing ZMC branding remains unchanged, including the transparent red logo asset.

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `background` | `#EEF2F5` | `#101418` | App background |
| `surface` | `#FFFFFF` | `#1B2127` | Cards, inputs, pickers, modal |
| `surfaceSecondary` | `#E5E9EC` | `#2A323A` | Secondary/cancel controls |
| `text` | `#1A1D21` | `#F4F7F9` | Primary text and values |
| `textMuted` | `#55606A` | `#B6C0C9` | Labels |
| `textSubtle` | `#8A939C` | `#8F9AA5` | Supporting values/placeholders |
| `border` | `#D0D5DA` | `#3A454F` | Input/card boundaries |
| `divider` | `#ECEFF2` | `#303A43` | Result separators |
| `primary` | `#007AFF` | `#5CADFF` | Links, gear, selected controls |
| `onPrimary` | `#FFFFFF` | `#07131F` | Text on primary controls |
| `danger` | `#C0392B` | `#FF8A80` | Validation and destructive copy |
| `dangerSurface` | `#FDF2F2` | `#3B2022` | Destructive control background |
| `dangerBorder` | `#E3B1B1` | `#754044` | Destructive control border |
| `overlay` | `rgba(0,0,0,0.40)` | `rgba(0,0,0,0.70)` | Modal backdrop |
| `shadow` | `#000000` | `#000000` | Card shadow |

Component StyleSheets become palette-driven style factories. Each themed component memoizes its styles from the active palette. Inline layout-only styles may remain static.

## Component Changes

### Main app

- Use the theme context and palette-driven styles.
- Add a 44-by-44 minimum touch target for the header gear.
- Open and close `AppearanceModal` from local UI state.
- Set Expo StatusBar content to `dark` for the light resolved theme and `light` for the dark resolved theme.
- Theme the root, heading, results card, labels, values, dividers, note, footer, and link.

### Inputs and pickers

- Theme labels, input/picker surfaces, text, borders, placeholder text, selection color, picker item text, and Android dropdown icon.
- Preserve existing dimensions, keyboard behavior, picker behavior, validation behavior, and test IDs.

### Add-item modal

- Theme its backdrop, sheet, text, inputs, buttons, validation message, and remove-all control.
- Preserve all existing in-flight save/remove guards and error behavior.

### Expo configuration

- Change `expo.userInterfaceStyle` in `Android/app.json` from `light` to `automatic`.
- Keep splash and adaptive-icon backgrounds unchanged because they are static brand/build assets rather than runtime surfaces.
- Add no native theme or navigation-bar dependency.

## Data Flow

1. `ThemeProvider` begins with preference `system`.
2. `useColorScheme()` supplies the current Android scheme.
3. The pure resolver produces `light` or `dark`.
4. The provider supplies semantic colors to all consumers.
5. AsyncStorage loads a validated saved override and updates the preference if present.
6. The user opens Appearance settings and selects a mode.
7. The provider applies the new preference in memory immediately and attempts to persist it.
8. On success, the modal closes. On failure, the modal remains open with an error while the in-session theme stays selected.
9. When preference is `system`, any later Android appearance change produces a new resolved theme automatically.

## Error Handling

- Invalid or absent stored values silently fall back to `system`.
- A storage read failure silently falls back to `system`; appearance must never block app startup.
- A storage write failure returns a user-visible modal error and does not crash or revert the current-session appearance.
- Repeated selection taps while a save is pending are disabled to prevent conflicting writes.
- Unknown system scheme values, including `null`, resolve to light mode as React Native's conservative fallback while the preference remains `system`.

## Testing

Use test-driven development and add coverage for:

1. Resolver behavior for every preference and light, dark, and null system schemes.
2. Storage behavior for missing, valid, invalid, read-failure, save-success, and save-failure cases.
3. First render using the system scheme when no saved override exists.
4. Loading and applying a persisted Light or Dark override.
5. Reacting to a system scheme change while preference is `system`.
6. Ignoring system changes while a manual override is selected.
7. Opening the modal from the accessible gear button.
8. Showing the current selected choice.
9. Applying and persisting each choice.
10. Keeping the modal open and showing an inline message when persistence fails.
11. Status-bar style matching the resolved theme.
12. Existing calculator, modal, validation, storage, and conversion behavior remaining green.

Manual Expo Go verification covers switching Android between light and dark while the app is open, persisting manual overrides through a reload, returning to System, picker readability, keyboard/input readability, modal readability, and contrast of result and error states.

## Non-Goals

- Scheduled themes.
- Per-screen theme settings.
- Custom colors beyond System, Light, and Dark.
- Synchronizing appearance between devices.
- Changing the logo or splash artwork.
- Migrating from React Native's deprecated `SafeAreaView` in the same change.
- Implementing the separate client-table data-correction specification.

## Acceptance Criteria

- A fresh installation follows Android's current appearance.
- System mode changes live when Android appearance changes.
- Light and Dark overrides apply immediately and persist across restarts.
- Appearance settings are reachable from an accessible header gear.
- Every current runtime surface is readable in both palettes.
- Persistence failures are handled without crashes or silent loss messaging.
- Typecheck, lint, all Jest tests, Expo dependency compatibility, Android export, and Expo Go smoke testing pass.
- The change is published through a separate pull request from `feature/system-theme` into `main`.
