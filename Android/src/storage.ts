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
