// One-line spec summaries shown under each entry in the picker sheets. Values
// are stored in the spreadsheet's units, so these convert back to whatever the
// user is working in.

import { GM2_PER_OZYD2, GM_PER_LBFT } from './conversions';
import { MM_PER_IN, UnitSystem } from './format';
import { BottomBar, FabricType, Tube } from './types';

export function describeTube(tube: Tube, units: UnitSystem): string {
  if (units === 'metric') {
    return `Ø ${tube.diameter.toFixed(1)} mm · ${Math.round(tube.weight * GM_PER_LBFT)} g/m`;
  }
  return `Ø ${(tube.diameter / MM_PER_IN).toFixed(2)} in · ${tube.weight.toFixed(3)} lb/ft`;
}

export function describeFabric(fabric: FabricType, units: UnitSystem): string {
  if (units === 'metric') {
    return `${Math.round(fabric.weight)} g/m² · ${fabric.thickness.toFixed(2)} mm`;
  }
  return `${(fabric.weight / GM2_PER_OZYD2).toFixed(1)} oz/yd² · ${(
    fabric.thickness / MM_PER_IN
  ).toFixed(3)} in`;
}

export function describeBottomBar(bar: BottomBar, units: UnitSystem): string {
  if (units === 'metric') return `${Math.round(bar.weightGM)} g/m`;
  return `${bar.weightLbFt.toFixed(3)} lb/ft`;
}
