# Transparent Sheet Safe Area Design

**Date:** 2026-08-15
**Status:** Approved

## Goal

Remove the moving full-screen background above the tube, fabric, bottom-bar,
custom-items, and settings sheets. While a sheet is open, the underlying app
must remain visible and dimmed in the status-bar or Dynamic Island area, and
only the actual sheet surface may slide.

The behavior must work consistently when tested in Expo Go on iPhone and in
the Android build intended for the Play Store.

## Current Cause

All affected surfaces share `DragSheet`. Its animated `screen` currently fills
the entire modal and owns both the theme background and the safe-area padding.
The iPhone top inset therefore becomes part of the animated surface. When the
sheet is dragged down, that blank background band moves before the grabber,
header, and page content.

Android has the equivalent risk around the status bar because the same shared
component also adds platform status-bar spacing to the animated view.

## Chosen Design

Keep the modal and its dim backdrop full-screen and fixed. Position a separate
animated sheet surface below the current top safe-area inset. The sheet surface
contains the grabber, header, and body, and extends through the bottom safe-area
inset so the home-indicator or Android navigation area retains the sheet's
background.

This creates three distinct layers:

1. The live calculator or settings screen underneath.
2. A fixed full-screen dim overlay.
3. An animated sheet surface beginning below the top system inset.

The top system inset belongs to the first two layers, not the animated sheet.
Dragging the grabber therefore reveals more of the dimmed underlying app
without moving or exposing a second background panel.

## Safe-Area Handling

Add Expo's compatible `react-native-safe-area-context` dependency and place a
`SafeAreaProvider` at the app root. `DragSheet` reads the current insets and:

- anchors the animated surface at `top: insets.top`;
- keeps it attached to the left, right, and bottom edges;
- applies `paddingBottom: insets.bottom` inside the surface;
- uses a translucent modal status/navigation-bar presentation where supported
  so the fixed dim layer can cover the complete window.

This avoids hard-coded Dynamic Island, notch, status-bar, or navigation-bar
sizes and keeps the layout correct across iPhone and Android devices.

## Preserved Behavior

- The grab handle remains visible and swipe-down-to-close remains available.
- Only the dedicated grab strip owns the drag responder.
- Existing open, close, snap-back, velocity, and dim-opacity animations remain
  synchronized through the current shared animated value.
- Search, scrolling, selection, add/remove actions, close buttons, Android back,
  accessibility labels, and existing test IDs remain unchanged.
- Tube, fabric, bottom-bar, custom-items, and settings sheets all inherit the
  fix from the shared component.

## Alternatives Considered

### Shorter card-style bottom sheet

This would show more of the calculator but reduce room for long searchable
lists and the settings screen. It changes the product layout beyond the
reported problem.

### Make only the existing padding transparent

This is a smaller patch, but the current full-screen animated surface would
still own the window and could expose another moving background band during a
drag. It also cannot preserve the bottom safe area robustly without knowing the
actual device insets.

## Testing

Automated tests will verify that:

- `DragSheet` renders a fixed backdrop separately from the animated surface;
- the animated surface uses the top inset as its top anchor and the bottom
  inset as internal padding;
- the shared sheet still exposes the existing grabber and accessibility
  contract;
- opening and using tube, fabric, bottom-bar, custom-items, and settings sheets
  retains existing behavior;
- typecheck, lint, and all Jest suites remain green.

Manual Expo Go verification on iPhone will confirm that the Dynamic Island area
shows the dimmed underlying app and remains stationary while the sheet opens,
drags, snaps back, and closes. Android verification will confirm the same
behavior around the status and navigation bars and ensure no content overlaps
system UI.

## Non-Goals

- Changing sheet height, list layout, header design, or animation timing.
- Removing the dim overlay.
- Allowing drag gestures from list or settings content.
- Replacing the current PanResponder animation system.
- Changing calculator formulas, datasets, settings, persistence, or theme
  choices.
- Redesigning add-item prompt modals that do not use `DragSheet`.

## Acceptance Criteria

- No themed full-screen panel appears above an open sheet.
- The underlying app remains visible and dimmed in the top system inset.
- Only the sheet surface moves during opening, dragging, snap-back, and closing.
- The sheet background continues through the bottom system inset.
- All shared sheets retain their current controls and interactions.
- iPhone Expo Go and Android device verification pass without system-UI overlap.
- Expo dependency compatibility, typecheck, lint, and all Jest tests pass.
