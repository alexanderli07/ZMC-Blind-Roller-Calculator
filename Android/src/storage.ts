// Data loading + persistence — port of DataManager.swift.
// Bundled JSON provides the defaults; user-added items are persisted in
// AsyncStorage and merged on top (the iOS version didn't persist additions).

import AsyncStorage from '@react-native-async-storage/async-storage';

import { FabricType, Tube, BottomBar } from './types';
import fabricDefaults from './data/fabricTypes.json';
import tubeDefaults from './data/tubes.json';
import bottomBarDefaults from './data/bottomBars.json';

const KEY_FABRIC = 'custom_fabricTypes';
const KEY_TUBE = 'custom_tubes';
const KEY_BOTTOM_BAR = 'custom_bottomBars';

async function loadCustom<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function appendCustom<T>(key: string, item: T): Promise<T[]> {
  const existing = await loadCustom<T>(key);
  const updated = [...existing, item];
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export async function loadFabricTypes(): Promise<FabricType[]> {
  const custom = await loadCustom<FabricType>(KEY_FABRIC);
  return [...(fabricDefaults as FabricType[]), ...custom];
}

export async function loadTubes(): Promise<Tube[]> {
  const custom = await loadCustom<Tube>(KEY_TUBE);
  return [...(tubeDefaults as Tube[]), ...custom];
}

export async function loadBottomBars(): Promise<BottomBar[]> {
  const custom = await loadCustom<BottomBar>(KEY_BOTTOM_BAR);
  return [...(bottomBarDefaults as BottomBar[]), ...custom];
}

export async function addFabricType(item: FabricType): Promise<FabricType[]> {
  await appendCustom(KEY_FABRIC, item);
  return loadFabricTypes();
}

export async function addTube(item: Tube): Promise<Tube[]> {
  await appendCustom(KEY_TUBE, item);
  return loadTubes();
}

export async function addBottomBar(item: BottomBar): Promise<BottomBar[]> {
  await appendCustom(KEY_BOTTOM_BAR, item);
  return loadBottomBars();
}

// Remove all user-added items for a category, reverting to the bundled defaults.
export async function clearFabricTypes(): Promise<FabricType[]> {
  await AsyncStorage.removeItem(KEY_FABRIC);
  return loadFabricTypes();
}

export async function clearTubes(): Promise<Tube[]> {
  await AsyncStorage.removeItem(KEY_TUBE);
  return loadTubes();
}

export async function clearBottomBars(): Promise<BottomBar[]> {
  await AsyncStorage.removeItem(KEY_BOTTOM_BAR);
  return loadBottomBars();
}

// ---- Managing individual user entries --------------------------------------
// The pickers only ever needed the merged lists. Editing the library one item
// at a time needs to know which names came from the user.

export function loadCustomFabricTypes(): Promise<FabricType[]> {
  return loadCustom<FabricType>(KEY_FABRIC);
}

export function loadCustomTubes(): Promise<Tube[]> {
  return loadCustom<Tube>(KEY_TUBE);
}

export function loadCustomBottomBars(): Promise<BottomBar[]> {
  return loadCustom<BottomBar>(KEY_BOTTOM_BAR);
}

async function removeCustom<T extends { name: string }>(key: string, name: string): Promise<void> {
  const existing = await loadCustom<T>(key);
  const remaining = existing.filter((item) => item.name !== name);
  if (remaining.length === existing.length) return;
  await AsyncStorage.setItem(key, JSON.stringify(remaining));
}

export async function removeFabricType(name: string): Promise<FabricType[]> {
  await removeCustom<FabricType>(KEY_FABRIC, name);
  return loadFabricTypes();
}

export async function removeTube(name: string): Promise<Tube[]> {
  await removeCustom<Tube>(KEY_TUBE, name);
  return loadTubes();
}

export async function removeBottomBar(name: string): Promise<BottomBar[]> {
  await removeCustom<BottomBar>(KEY_BOTTOM_BAR, name);
  return loadBottomBars();
}

export async function clearAllCustom(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEY_FABRIC),
    AsyncStorage.removeItem(KEY_TUBE),
    AsyncStorage.removeItem(KEY_BOTTOM_BAR),
  ]);
}

// ---- Export / import -------------------------------------------------------
// Only user-added items travel; the bundled defaults are always present.

export interface LibraryExport {
  version: 1;
  fabricTypes: FabricType[];
  tubes: Tube[];
  bottomBars: BottomBar[];
}

export type ImportResult =
  | { ok: true; added: number; skipped: number }
  | { ok: false; error: string };

export async function exportLibrary(): Promise<LibraryExport> {
  const [fabricTypes, tubes, bottomBars] = await Promise.all([
    loadCustomFabricTypes(),
    loadCustomTubes(),
    loadCustomBottomBars(),
  ]);
  return { version: 1, fabricTypes, tubes, bottomBars };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// Imported entries are rebuilt field by field so an arbitrary payload can never
// be persisted wholesale.
function toFabricType(value: unknown): FabricType | null {
  if (!isRecord(value)) return null;
  const { name, weight, thickness } = value;
  if (typeof name !== 'string' || name.trim() === '') return null;
  if (!positive(weight) || !positive(thickness)) return null;
  return { name: name.trim(), weight, thickness };
}

function toTube(value: unknown): Tube | null {
  if (!isRecord(value)) return null;
  const { name, diameter, thickness, moment, elasticity, weight } = value;
  if (typeof name !== 'string' || name.trim() === '') return null;
  if (!positive(diameter) || !positive(moment) || !positive(elasticity) || !positive(weight)) {
    return null;
  }
  return {
    name: name.trim(),
    diameter,
    thickness: positive(thickness) ? thickness : null,
    moment,
    elasticity,
    weight,
  };
}

function toBottomBar(value: unknown): BottomBar | null {
  if (!isRecord(value)) return null;
  const { name, weightGM, weightLbFt } = value;
  if (typeof name !== 'string' || name.trim() === '') return null;
  if (!positive(weightGM) || !positive(weightLbFt)) return null;
  return { name: name.trim(), weightGM, weightLbFt };
}

function collect<T>(value: unknown, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map).filter((item): item is T => item !== null);
}

async function mergeCustom<T extends { name: string }>(
  key: string,
  incoming: T[],
  reserved: string[]
): Promise<{ added: number; skipped: number }> {
  const existing = await loadCustom<T>(key);
  const taken = new Set([...reserved, ...existing.map((item) => item.name)]);
  const accepted: T[] = [];
  let skipped = 0;

  for (const item of incoming) {
    if (taken.has(item.name)) {
      skipped += 1;
      continue;
    }
    taken.add(item.name);
    accepted.push(item);
  }

  if (accepted.length > 0) {
    await AsyncStorage.setItem(key, JSON.stringify([...existing, ...accepted]));
  }
  return { added: accepted.length, skipped };
}

function namesOf(items: { name: string }[]): string[] {
  return items.map((item) => item.name);
}

export async function importLibrary(json: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That is not valid JSON.' };
  }
  if (!isRecord(parsed)) {
    return { ok: false, error: 'That does not look like an exported library.' };
  }

  const fabricTypes = collect(parsed.fabricTypes, toFabricType);
  const tubes = collect(parsed.tubes, toTube);
  const bottomBars = collect(parsed.bottomBars, toBottomBar);
  if (fabricTypes.length + tubes.length + bottomBars.length === 0) {
    return { ok: false, error: 'No usable fabric types, tubes, or bottom bars found.' };
  }

  const merged = await Promise.all([
    mergeCustom<FabricType>(KEY_FABRIC, fabricTypes, namesOf(fabricDefaults as FabricType[])),
    mergeCustom<Tube>(KEY_TUBE, tubes, namesOf(tubeDefaults as Tube[])),
    mergeCustom<BottomBar>(KEY_BOTTOM_BAR, bottomBars, namesOf(bottomBarDefaults as BottomBar[])),
  ]);

  return {
    ok: true,
    added: merged.reduce((total, result) => total + result.added, 0),
    skipped: merged.reduce((total, result) => total + result.skipped, 0),
  };
}
