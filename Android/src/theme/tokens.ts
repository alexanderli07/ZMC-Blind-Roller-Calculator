// Shared layout and type scale. Component styles reference these instead of
// repeating magic numbers, so density changes happen in one place.

// Pulled from the ZMC wordmark. Fixed — the app has one brand colour.
export const ZMC_RED = '#C8102E';
// The same red lifted until it clears AA against the dark surface.
export const ZMC_RED_ON_DARK = '#FF4D6A';

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const font = {
  caption: 11,
  footnote: 12,
  label: 13,
  body: 15,
  title: 17,
  heading: 20,
  hero: 34,
} as const;

// Minimum comfortable touch target. The old 22px "+" was half of this.
export const MIN_TOUCH = 44;

// The header logo is assets/zmcLogo.png at 313x161.
export const LOGO_ASPECT = 313 / 161;
export const LOGO_HEIGHT = 38;
export const LOGO_WIDTH = Math.round(LOGO_HEIGHT * LOGO_ASPECT);
