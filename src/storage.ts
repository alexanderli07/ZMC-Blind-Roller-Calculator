// Data manager — port of the iOS DataManager.swift.
//
// Note: the iOS version tried to save user-added items back into the read-only
// app bundle, which silently fails on device (items were lost on restart).
// Here we merge the bundled defaults with anything the user adds and persist
// the additions in AsyncStorage, so they survive app restarts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FabricType, Tube, BottomBar } from './types';

import defaultFabricTypes from './data/fabricTypes.json';
import defaultTubes from './data/tubes.json';
import defaultBottomBars from './data/bottomBars.json';

const FABRIC_KEY = '@zmc/customFabricTypes';
const TUBE_KEY = '@zmc/customTubes';
const BOTTOM_BAR_KEY = '@zmc/customBottomBars';

async function loadCustom<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (e) {
    console.warn(`Failed to load ${key}:`, e);
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
  const custom = await loadCustom<FabricType>(FABRIC_KEY);
  return [...(defaultFabricTypes as FabricType[]), ...custom];
}

export async function loadTubes(): Promise<Tube[]> {
  const custom = await loadCustom<Tube>(TUBE_KEY);
  return [...(defaultTubes as Tube[]), ...custom];
}

export async function loadBottomBars(): Promise<BottomBar[]> {
  const custom = await loadCustom<BottomBar>(BOTTOM_BAR_KEY);
  return [...(defaultBottomBars as BottomBar[]), ...custom];
}

export async function addFabricType(item: FabricType): Promise<FabricType[]> {
  await appendCustom(FABRIC_KEY, item);
  return loadFabricTypes();
}

export async function addTube(item: Tube): Promise<Tube[]> {
  await appendCustom(TUBE_KEY, item);
  return loadTubes();
}

export async function addBottomBar(item: BottomBar): Promise<BottomBar[]> {
  await appendCustom(BOTTOM_BAR_KEY, item);
  return loadBottomBars();
}
