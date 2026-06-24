jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addBottomBar,
  addFabricType,
  addTube,
  clearBottomBars,
  clearFabricTypes,
  clearTubes,
  loadBottomBars,
  loadFabricTypes,
  loadTubes,
} from '../src/storage';

const customFabric = { name: 'Solar', weight: 400, thickness: 0.5 };
const customTube = {
  name: 'Wide tube',
  diameter: 50.8,
  thickness: 1.4,
  moment: 0.1,
  elasticity: 10007760,
  weight: 0.5,
};
const customBottomBar = { name: 'Heavy bar', weightGM: 595.264, weightLbFt: 0.4 };

const categories = [
  {
    category: 'fabric',
    key: 'custom_fabricTypes',
    item: customFabric,
    add: () => addFabricType(customFabric),
    load: loadFabricTypes,
    clear: clearFabricTypes,
  },
  {
    category: 'tube',
    key: 'custom_tubes',
    item: customTube,
    add: () => addTube(customTube),
    load: loadTubes,
    clear: clearTubes,
  },
  {
    category: 'bottom bar',
    key: 'custom_bottomBars',
    item: customBottomBar,
    add: () => addBottomBar(customBottomBar),
    load: loadBottomBars,
    clear: clearBottomBars,
  },
];

const storageKeys = categories.map(({ key }) => key);

beforeEach(async () => {
  await AsyncStorage.clear();
});

test.each(categories)(
  'persists a custom $category item under its separate key and loads it with defaults',
  async ({ add, item, key, load }) => {
    await add();

    await expect(AsyncStorage.getItem(key)).resolves.toBe(JSON.stringify([item]));
    await expect(load()).resolves.toContainEqual(item);

    const otherKeys = storageKeys.filter((storageKey) => storageKey !== key);
    await Promise.all(otherKeys.map(async (storageKey) => {
      await expect(AsyncStorage.getItem(storageKey)).resolves.toBeNull();
    }));
  }
);

test.each(categories)(
  'clears custom $category items and returns bundled defaults',
  async ({ add, clear, item, key }) => {
    await add();

    const defaults = await clear();

    expect(defaults).not.toContainEqual(item);
    expect(defaults.length).toBeGreaterThan(0);
    await expect(AsyncStorage.getItem(key)).resolves.toBeNull();
  }
);
