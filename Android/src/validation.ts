import { parsePositiveNumber } from './calculations';
import { bottomBarFromInputs, fabricFromInputs, tubeFromInputs } from './conversions';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface FabricInput {
  name: string;
  weight: number;
  thickness: number;
}

export interface TubeInput {
  name: string;
  diameter: number;
  thickness: number;
}

export interface BottomBarInput {
  name: string;
  weightLbFt: number;
}

const OUT_OF_RANGE_ERROR = 'Values are outside the supported calculation range.';

function areFiniteAndPositive(values: number[]): boolean {
  return values.every((value) => Number.isFinite(value) && value > 0);
}

function validateName(name: string, existingNames: string[]): ValidationResult<string> {
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Name is required.' };
  }

  if (existingNames.some(
    (existingName) => existingName.trim().toLowerCase() === trimmedName.toLowerCase()
  )) {
    return { ok: false, error: 'An item with this name already exists.' };
  }

  return { ok: true, value: trimmedName };
}

export function validateFabricInput(
  values: Record<string, string>,
  existingNames: string[]
): ValidationResult<FabricInput> {
  const name = validateName(values.name, existingNames);
  if (!name.ok) return name;

  const weight = parsePositiveNumber(values.weight);
  if (weight === null) {
    return { ok: false, error: 'Weight must be a number greater than 0.' };
  }

  const thickness = parsePositiveNumber(values.thickness);
  if (thickness === null) {
    return { ok: false, error: 'Thickness must be a number greater than 0.' };
  }

  const converted = fabricFromInputs(name.value, weight, thickness);
  if (!areFiniteAndPositive([converted.weight, converted.thickness])) {
    return { ok: false, error: OUT_OF_RANGE_ERROR };
  }

  return { ok: true, value: { name: name.value, weight, thickness } };
}

export function validateTubeInput(
  values: Record<string, string>,
  existingNames: string[]
): ValidationResult<TubeInput> {
  const name = validateName(values.name, existingNames);
  if (!name.ok) return name;

  const diameter = parsePositiveNumber(values.diameter);
  if (diameter === null) {
    return { ok: false, error: 'Diameter must be a number greater than 0.' };
  }

  const thickness = parsePositiveNumber(values.thickness);
  if (thickness === null) {
    return { ok: false, error: 'Thickness must be a number greater than 0.' };
  }

  if (thickness >= diameter / 2) {
    return { ok: false, error: 'Thickness must be less than half the diameter.' };
  }

  const converted = tubeFromInputs(name.value, diameter, thickness);
  if (!areFiniteAndPositive([
    converted.diameter,
    converted.thickness ?? 0,
    converted.moment,
    converted.elasticity,
    converted.weight,
  ])) {
    return { ok: false, error: OUT_OF_RANGE_ERROR };
  }

  return { ok: true, value: { name: name.value, diameter, thickness } };
}

export function validateBottomBarInput(
  values: Record<string, string>,
  existingNames: string[]
): ValidationResult<BottomBarInput> {
  const name = validateName(values.name, existingNames);
  if (!name.ok) return name;

  const weightLbFt = parsePositiveNumber(values.weightLbFt);
  if (weightLbFt === null) {
    return { ok: false, error: 'Weight must be a number greater than 0.' };
  }

  const converted = bottomBarFromInputs(name.value, weightLbFt);
  if (!areFiniteAndPositive([converted.weightLbFt, converted.weightGM])) {
    return { ok: false, error: OUT_OF_RANGE_ERROR };
  }

  return { ok: true, value: { name: name.value, weightLbFt } };
}
