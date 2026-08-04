import {
  convertDimensionText,
  EMPTY_READING,
  lengthLabel,
  lengthReading,
  toInchesText,
  weightReading,
} from '../src/format';

test('shows the primary unit with the secondary alongside', () => {
  expect(lengthReading(1.574, 39.975, 'imperial', 3, true)).toEqual({
    value: '1.574',
    unit: 'in',
    secondary: '39.975 mm',
  });
});

test('leads with metric when that is the chosen system', () => {
  expect(lengthReading(1.574, 39.975, 'metric', 1, false)).toEqual({
    value: '40.0',
    unit: 'mm',
    secondary: null,
  });
});

test('falls back to a placeholder while inputs are incomplete', () => {
  expect(weightReading(null, null, 'imperial', 2, true)).toEqual(EMPTY_READING);
  expect(lengthReading(1.5, null, 'imperial', 2, true)).toEqual(EMPTY_READING);
});

test('rounds a weight to the requested places', () => {
  expect(weightReading(3.8449, 1.7442, 'imperial', 2, true)).toEqual({
    value: '3.84',
    unit: 'lb',
    secondary: '1.74 kg',
  });
});

test('labels the deflection limit in the active unit', () => {
  expect(lengthLabel(0.375, 'imperial', 3)).toBe('0.375 in');
  expect(lengthLabel(0.375, 'metric', 3)).toBe('9.525 mm');
  // 0.375 * 25.4 lands on 9.52499999... in binary, so asking for two places
  // rounds down. The default is three, where the exact value shows.
  expect(lengthLabel(0.375, 'metric', 2)).toBe('9.52 mm');
});

test('keeps the physical size when the unit toggle changes', () => {
  expect(convertDimensionText('48', 'imperial', 'metric')).toBe('1219.2');
  expect(convertDimensionText('1219.2', 'metric', 'imperial')).toBe('48');
  expect(convertDimensionText('48', 'imperial', 'imperial')).toBe('48');
});

test('leaves text alone when it is not a number', () => {
  expect(convertDimensionText('abc', 'imperial', 'metric')).toBe('abc');
  expect(convertDimensionText('', 'imperial', 'metric')).toBe('');
  expect(toInchesText('abc', 'metric')).toBe('abc');
});

test('hands the formulas inches whatever was typed', () => {
  expect(toInchesText('48', 'imperial')).toBe('48');
  expect(Number(toInchesText('1219.2', 'metric'))).toBeCloseTo(48, 6);
});
