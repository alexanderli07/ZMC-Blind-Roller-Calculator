// Engineering calculations — direct port of the computed properties in the
// iOS ContentView.swift. Formulas and default fallbacks preserved exactly.

import { FabricType, Tube, BottomBar } from './types';

// Mirrors Swift's `Double(string) ?? fallback`: returns the fallback when the
// string is empty or not a valid number.
function parseOr(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (trimmed === '') return fallback;
  const n = Number(trimmed);
  return Number.isNaN(n) ? fallback : n;
}

export interface CalcInputs {
  tube: Tube | undefined;
  fabric: FabricType | undefined;
  bottomBar: BottomBar | undefined;
  blindWidth: string; // mm (raw text input)
  blindHeight: string; // mm (raw text input)
}

// Total assembled weight of the blind, in kg.
export function totalWeight(i: CalcInputs): number {
  const fabricWeight = i.fabric?.weight ?? 305;
  const bottomBarWeight = i.bottomBar?.weightGM ?? 210;

  const width = parseOr(i.blindWidth, 20.0);
  const height = parseOr(i.blindHeight, 0.02);

  // Fabric: g/m² × area(m²) → g → kg
  const fabricWeightInKg = ((fabricWeight * width) / 1000) * (height / 1000) / 1000;
  // Bottom bar: g/m × length(m) → g → kg
  const bottomBarWeightInKg = ((bottomBarWeight * width) / 1000) / 1000;

  return fabricWeightInKg + bottomBarWeightInKg;
}

// Diameter of the rolled-up fabric on the tube, in mm.
// Solves an Archimedean-spiral quadratic for the number of revolutions.
export function rollerDiameter(i: CalcInputs): number {
  const fabricThickness = i.fabric?.thickness ?? 0.19;
  const tubeDiameter = i.tube?.diameter ?? 31.8;

  const height = parseOr(i.blindHeight, 0.0);
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

// Deflection from the blind's weight as a central point load.
export function pointDeflection(i: CalcInputs): number {
  const tubeMoment = i.tube?.moment ?? 0.027930224;
  const tubeElasticity = i.tube?.elasticity ?? 10007760;
  const width = parseOr(i.blindWidth, 20.0);

  const w = totalWeight(i);
  return (
    ((((((w * 1000) / 454) * width) / 25.4) * width) / 25.4 * width) /
    25.4 /
    (48 * tubeMoment * tubeElasticity)
  );
}

// Deflection from the tube's own self-weight as a distributed load.
export function distributedDeflection(i: CalcInputs): number {
  const tubeMoment = i.tube?.moment ?? 0.027930224;
  const tubeElasticity = i.tube?.elasticity ?? 10007760;
  const tubeWeight = i.tube?.weight ?? 0.192;
  const width = parseOr(i.blindWidth, 20.0);

  return (
    (((((((5 * tubeWeight) / 12) * width) / 25.4) * width) / 25.4 * width) /
      25.4 *
      width) /
    25.4 /
    (384 * tubeMoment * tubeElasticity)
  );
}

export function totalDeflection(i: CalcInputs): number {
  return pointDeflection(i) + distributedDeflection(i);
}
