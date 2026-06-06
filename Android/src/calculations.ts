// Calculation formulas — ported verbatim from the current ContentView.swift.
// NOTE: Blind Width / Height are entered in INCHES and converted to mm
// internally (× 25.4), matching the iOS app. Each formula keeps the same
// fallback defaults the Swift code used when a picker / input was empty.

import { FabricType, Tube, BottomBar } from './types';

export interface CalcInputs {
  tube?: Tube;
  fabric?: FabricType;
  bottomBar?: BottomBar;
  blindWidth: string; // inches
  blindHeight: string; // inches
}

// The iOS app uses this as a fixed constant rather than the per-tube value.
const TUBE_ELASTICITY = 10007760;

// Maximum allowable tube deflection (shown as a note under the results).
export const MAX_DEFLECTION_IN = 0.375;
export const MAX_DEFLECTION_MM = 9.525;

// Mirrors Swift's `Double(string) ?? fallback`: an empty or non-numeric
// string yields the fallback (JS Number("") would be 0, which is wrong here).
function parseOr(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (trimmed === '') return fallback;
  const n = Number(trimmed);
  return Number.isNaN(n) ? fallback : n;
}

// ---- Total weight ----------------------------------------------------------

export function totalWeightKg(inputs: CalcInputs): number {
  const fabricWeight = inputs.fabric?.weight ?? 305;
  const bottomBarWeight = inputs.bottomBar?.weightGM ?? 210;

  const width = parseOr(inputs.blindWidth, 20.0) * 25.4; // in -> mm
  const height = parseOr(inputs.blindHeight, 0.02) * 25.4; // in -> mm

  const fabricWeightInKg = ((fabricWeight * width / 1000) * (height / 1000)) / 1000;
  const bottomBarWeightInKg = (bottomBarWeight * width / 1000) / 1000;

  return fabricWeightInKg + bottomBarWeightInKg;
}

export function totalWeightLb(inputs: CalcInputs): number {
  return totalWeightKg(inputs) * 2.20462;
}

// ---- Roller diameter -------------------------------------------------------

export function rollerDiameterMm(inputs: CalcInputs): number {
  const fabricThickness = inputs.fabric?.thickness ?? 0.19;
  const tubeDiameter = inputs.tube?.diameter ?? 31.8;

  const height = parseOr(inputs.blindHeight, 0.0) * 25.4; // in -> mm
  const pi = Math.PI;

  const a = fabricThickness;
  const b = tubeDiameter + fabricThickness;
  const c = -(height / pi);

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return 0.0;
  }

  const revolutions = (-b + Math.sqrt(discriminant)) / (2 * a);
  return tubeDiameter + fabricThickness * 2 * revolutions;
}

export function rollerDiameterInch(inputs: CalcInputs): number {
  return rollerDiameterMm(inputs) * 0.03937;
}

// ---- Tube deflection -------------------------------------------------------
// Width stays in inches here (not converted); the sum is converted to mm at
// the end via × 25.4.

function pointDeflection(inputs: CalcInputs): number {
  const tubeMoment = inputs.tube?.moment ?? 0.027930224;
  const width = parseOr(inputs.blindWidth, 20.0); // inches

  const weightInLB = totalWeightKg(inputs) * 1000 / 454;
  const numerator = weightInLB * width * width * width;
  const denominator = 48 * tubeMoment * TUBE_ELASTICITY;
  return numerator / denominator;
}

function distributedDeflection(inputs: CalcInputs): number {
  const tubeMoment = inputs.tube?.moment ?? 0.027930224;
  const tubeWeight = inputs.tube?.weight ?? 0.192;
  const width = parseOr(inputs.blindWidth, 20.0); // inches

  const numerator = 5 * tubeWeight / 12 * width * width * width * width;
  const denominator = 384 * tubeMoment * TUBE_ELASTICITY;
  return numerator / denominator;
}

export function tubeDeflectionMm(inputs: CalcInputs): number {
  return (pointDeflection(inputs) + distributedDeflection(inputs)) * 25.4;
}

export function tubeDeflectionInch(inputs: CalcInputs): number {
  return tubeDeflectionMm(inputs) * 0.03937;
}
