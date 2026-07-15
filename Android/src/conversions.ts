// Derive the internal storage values from the user-facing "add item" inputs.
// These mirror the calculator block at the bottom of
// "ZMC fabric tube and bottom bar info for APP Nov. 25, 2024.xlsx".

import { FabricType, Tube, BottomBar } from './types';

const MM_PER_IN = 25.4;
const IN4_PER_MM4 = MM_PER_IN ** 4; // 416231.4256
const TUBE_ELASTICITY = 10007760;

// 1 oz/yd² = 33.906 g/m²
export const GM2_PER_OZYD2 = 33.906;
// 1 lb/ft = 1488.16 g/m
export const GM_PER_LBFT = 1488.16;
// lb/ft per mm² of aluminium cross-section (calibrated to the spreadsheet:
// D=1.5in, t=0.055in -> 0.29198 lb/ft).
const LBFT_PER_MM2 = 0.00181265;

// New tube: user enters diameter & thickness in INCHES; we compute the
// moment of inertia (in⁴, hollow circular section) and weight (lb/ft).
export function tubeFromInputs(
  name: string,
  diameterIn: number,
  thicknessIn: number
): Tube {
  const D = diameterIn * MM_PER_IN; // outer diameter, mm
  const t = thicknessIn * MM_PER_IN; // wall thickness, mm
  const Di = D - 2 * t; // inner diameter, mm

  const momentMm4 = (Math.PI / 64) * (D ** 4 - Di ** 4);
  const moment = momentMm4 / IN4_PER_MM4; // in⁴ (unit the formulas expect)

  const areaMm2 = (Math.PI / 4) * (D ** 2 - Di ** 2);
  const weight = areaMm2 * LBFT_PER_MM2; // lb/ft

  return { name, diameter: D, thickness: t, moment, elasticity: TUBE_ELASTICITY, weight };
}

// New fabric: user enters weight in oz/yd² and thickness in inches.
export function fabricFromInputs(
  name: string,
  weightOzYd2: number,
  thicknessIn: number
): FabricType {
  return {
    name,
    weight: weightOzYd2 * GM2_PER_OZYD2, // g/m²
    thickness: thicknessIn * MM_PER_IN, // mm
  };
}

// New bottom bar: user enters weight in lb/ft.
export function bottomBarFromInputs(name: string, weightLbFt: number): BottomBar {
  return {
    name,
    weightLbFt,
    weightGM: weightLbFt * GM_PER_LBFT, // g/m
  };
}
