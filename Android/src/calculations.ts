// Calculation formulas — ported verbatim from ContentView.swift.
// Each formula keeps the same fallback defaults the Swift code used when a
// picker / input was left empty, so results match the iOS app exactly.

import { FabricType, Tube, BottomBar } from './types';

export interface CalcInputs {
  tube?: Tube;
  fabric?: FabricType;
  bottomBar?: BottomBar;
  blindWidth: string;
  blindHeight: string;
}

// Mirrors Swift's `Double(string) ?? fallback`: an empty or non-numeric
// string yields the fallback (JS Number("") would be 0, which is wrong here).
function parseOr(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (trimmed === '') return fallback;
  const n = Number(trimmed);
  return Number.isNaN(n) ? fallback : n;
}

export function totalWeight(inputs: CalcInputs): number {
  const fabricWeight = inputs.fabric?.weight ?? 305;
  const bottomBarWeight = inputs.bottomBar?.weightGM ?? 210;

  const width = parseOr(inputs.blindWidth, 20.0);
  const height = parseOr(inputs.blindHeight, 0.02);

  const fabricWeightInKg = ((fabricWeight * width / 1000) * (height / 1000)) / 1000; // kg
  const bottomBarWeightInKg = (bottomBarWeight * width / 1000) / 1000; // kg

  return fabricWeightInKg + bottomBarWeightInKg;
}

export function rollerDiameter(inputs: CalcInputs): number {
  const fabricThickness = inputs.fabric?.thickness ?? 0.19;
  const tubeDiameter = inputs.tube?.diameter ?? 31.8;

  const height = parseOr(inputs.blindHeight, 0.0);
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

function pointDeflection(inputs: CalcInputs): number {
  const tubeMoment = inputs.tube?.moment ?? 0.027930224;
  const tubeElasticity = inputs.tube?.elasticity ?? 10007760;
  const width = parseOr(inputs.blindWidth, 20.0);

  return (
    totalWeight(inputs) * 1000 / 454 *
    width / 25.4 * width / 25.4 * width / 25.4 /
    (48 * tubeMoment * tubeElasticity)
  );
}

function distributedDeflection(inputs: CalcInputs): number {
  const tubeMoment = inputs.tube?.moment ?? 0.027930224;
  const tubeElasticity = inputs.tube?.elasticity ?? 10007760;
  const tubeWeight = inputs.tube?.weight ?? 0.192;
  const width = parseOr(inputs.blindWidth, 20.0);

  return (
    (5 * tubeWeight / 12 *
      width / 25.4 * width / 25.4 * width / 25.4 * width / 25.4) /
    (384 * tubeMoment * tubeElasticity)
  );
}

export function totalDeflection(inputs: CalcInputs): number {
  return pointDeflection(inputs) + distributedDeflection(inputs);
}
