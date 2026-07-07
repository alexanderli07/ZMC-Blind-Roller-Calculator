// Calculation formulas ported from ContentView.swift. Blind width and height
// are entered in inches and converted to millimetres where required.

import { FabricType, Tube, BottomBar } from './types';

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

// The iOS app uses this as a fixed constant rather than the per-tube value.
const TUBE_ELASTICITY = 10007760;

// Maximum allowable tube deflection (shown as a note under the results).
export const MAX_DEFLECTION_IN = 0.375;
export const MAX_DEFLECTION_MM = 9.525;

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

// ---- Total weight ----------------------------------------------------------

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

export function totalWeightLb(inputs: CalcInputs): number | null {
  const weightKg = totalWeightKg(inputs);
  return weightKg === null ? null : weightKg * 2.20462;
}

// ---- Roller diameter -------------------------------------------------------

function calculateRollerDiameterMm(inputs: ResolvedCalcInputs): number {
  const fabricThickness = inputs.fabric.thickness;
  const tubeDiameter = inputs.tube.diameter;
  const heightMm = inputs.heightIn * 25.4;
  const pi = Math.PI;

  const a = fabricThickness;
  const b = tubeDiameter + fabricThickness;
  const c = -(heightMm / pi);

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return 0.0;
  }

  const revolutions = (-b + Math.sqrt(discriminant)) / (2 * a);
  return tubeDiameter + fabricThickness * 2 * revolutions;
}

export function rollerDiameterMm(inputs: CalcInputs): number | null {
  const resolved = resolveInputs(inputs);
  return resolved ? calculateRollerDiameterMm(resolved) : null;
}

export function rollerDiameterInch(inputs: CalcInputs): number | null {
  const diameterMm = rollerDiameterMm(inputs);
  return diameterMm === null ? null : diameterMm * 0.03937;
}

// ---- Tube deflection -------------------------------------------------------
// Width stays in inches here; the sum is converted to mm at the end.

function pointDeflection(inputs: ResolvedCalcInputs): number {
  const weightInLB = calculateTotalWeightKg(inputs) * 1000 / 454;
  const numerator = weightInLB * inputs.widthIn * inputs.widthIn * inputs.widthIn;
  const denominator = 48 * inputs.tube.moment * TUBE_ELASTICITY;
  return numerator / denominator;
}

function distributedDeflection(inputs: ResolvedCalcInputs): number {
  const numerator = 5 * inputs.tube.weight / 12 * inputs.widthIn * inputs.widthIn * inputs.widthIn * inputs.widthIn;
  const denominator = 384 * inputs.tube.moment * TUBE_ELASTICITY;
  return numerator / denominator;
}

export function tubeDeflectionMm(inputs: CalcInputs): number | null {
  const resolved = resolveInputs(inputs);
  return resolved ? (pointDeflection(resolved) + distributedDeflection(resolved)) * 25.4 : null;
}

export function tubeDeflectionInch(inputs: CalcInputs): number | null {
  const deflectionMm = tubeDeflectionMm(inputs);
  return deflectionMm === null ? null : deflectionMm * 0.03937;
}
