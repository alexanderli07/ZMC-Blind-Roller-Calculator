jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addFabricType,
  clearFabricTypes,
  loadFabricTypes,
} from '../src/storage';

const customFabric = { name: 'Solar', weight: 400, thickness: 0.5 };

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('persists a custom item alongside bundled defaults', async () => {
  await addFabricType(customFabric);
  await expect(loadFabricTypes()).resolves.toContainEqual(customFabric);
});

test('clears custom items without removing bundled defaults', async () => {
  await addFabricType(customFabric);
  const fabrics = await clearFabricTypes();
  expect(fabrics).not.toContainEqual(customFabric);
  expect(fabrics.length).toBeGreaterThan(0);
});
