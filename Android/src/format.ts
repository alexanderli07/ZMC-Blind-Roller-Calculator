// Unit handling and display formatting. The formulas in calculations.ts always
// work in the units they were written for; this layer decides what the user
// actually sees, and converts entered dimensions on the way in.

export type UnitSystem = 'imperial' | 'metric';

export const MM_PER_IN = 25.4;

// Value and unit stay separate so the hero readout can typeset the number
// large and the unit small.
export interface Reading {
  value: string;
  unit: string;
  secondary: string | null;
}

export const EMPTY_READING: Reading = { value: '—', unit: '', secondary: null };

interface Part {
  value: number;
  unit: string;
}

function fixed(value: number, decimals: number): string {
  const scale = 10 ** decimals;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value));
  const rounded = Math.round((value + tolerance) * scale) / scale;
  return rounded.toFixed(decimals);
}

function pick(
  imperial: Part,
  metric: Part,
  system: UnitSystem,
  decimals: number,
  showSecondary: boolean
): Reading {
  const primary = system === 'imperial' ? imperial : metric;
  const other = system === 'imperial' ? metric : imperial;
  return {
    value: fixed(primary.value, decimals),
    unit: primary.unit,
    secondary: showSecondary ? `${fixed(other.value, decimals)} ${other.unit}` : null,
  };
}

export function lengthReading(
  inch: number | null,
  mm: number | null,
  system: UnitSystem,
  decimals: number,
  showSecondary: boolean
): Reading {
  if (inch === null || mm === null) return EMPTY_READING;
  return pick({ value: inch, unit: 'in' }, { value: mm, unit: 'mm' }, system, decimals, showSecondary);
}

export function weightReading(
  lb: number | null,
  kg: number | null,
  system: UnitSystem,
  decimals: number,
  showSecondary: boolean
): Reading {
  if (lb === null || kg === null) return EMPTY_READING;
  return pick({ value: lb, unit: 'lb' }, { value: kg, unit: 'kg' }, system, decimals, showSecondary);
}

// A flat "0.375 in" / "9.525 mm" for captions, with no secondary unit.
export function lengthLabel(inch: number, system: UnitSystem, decimals: number): string {
  const shown = system === 'imperial' ? inch : inch * MM_PER_IN;
  return `${fixed(shown, decimals)} ${unitSuffix(system)}`;
}

export function unitSuffix(system: UnitSystem): string {
  return system === 'imperial' ? 'in' : 'mm';
}

// Entered dimensions are held as the text the user typed in the active unit.
// Invalid or empty text passes through untouched so validation can report it.
export function toInchesText(value: string, system: UnitSystem): string {
  if (system === 'imperial') return value;
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  if (trimmed === '' || !Number.isFinite(parsed)) return value;
  return String(parsed / MM_PER_IN);
}

// Switching units keeps the physical blind the same rather than reinterpreting
// the number, so 48 in becomes 1219.2 mm.
export function convertDimensionText(value: string, from: UnitSystem, to: UnitSystem): string {
  if (from === to) return value;
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  if (trimmed === '' || !Number.isFinite(parsed)) return value;
  const converted = to === 'metric' ? parsed * MM_PER_IN : parsed / MM_PER_IN;
  return String(Number(converted.toFixed(3)));
}
