import {
  CalcInputs,
  parsePositiveNumber,
  rollerDiameterInch,
  rollerDiameterMm,
  totalWeightKg,
  totalWeightLb,
  tubeDeflectionInch,
  tubeDeflectionMm,
} from '../src/calculations';
import fabrics from '../src/data/fabricTypes.json';
import tubes from '../src/data/tubes.json';
import bottomBars from '../src/data/bottomBars.json';

const completeInputs: CalcInputs = {
  tube: tubes[0],
  fabric: fabrics[0],
  bottomBar: bottomBars[0],
  blindWidth: '72',
  blindHeight: '96',
};

describe('calculator input boundary', () => {
  test.each(['', 'abc', '0', '-1', 'Infinity'])('rejects width %p', (blindWidth) => {
    expect(totalWeightKg({ ...completeInputs, blindWidth })).toBeNull();
    expect(rollerDiameterMm({ ...completeInputs, blindWidth })).toBeNull();
    expect(tubeDeflectionMm({ ...completeInputs, blindWidth })).toBeNull();
  });

  test.each(['', 'abc', '0', '-1', 'Infinity'])('rejects height %p', (blindHeight) => {
    expect(totalWeightKg({ ...completeInputs, blindHeight })).toBeNull();
    expect(rollerDiameterMm({ ...completeInputs, blindHeight })).toBeNull();
    expect(tubeDeflectionMm({ ...completeInputs, blindHeight })).toBeNull();
  });

  test.each([
    ['tube', { tube: undefined }],
    ['fabric', { fabric: undefined }],
    ['bottom bar', { bottomBar: undefined }],
  ])('rejects a missing %s', (_label, missing) => {
    const inputs = { ...completeInputs, ...missing };
    expect(totalWeightKg(inputs)).toBeNull();
    expect(rollerDiameterMm(inputs)).toBeNull();
    expect(tubeDeflectionMm(inputs)).toBeNull();
  });

  test('parses only finite positive numbers', () => {
    expect(parsePositiveNumber(' 12.5 ')).toBe(12.5);
    expect(parsePositiveNumber('')).toBeNull();
    expect(parsePositiveNumber('0')).toBeNull();
    expect(parsePositiveNumber('-2')).toBeNull();
    expect(parsePositiveNumber('Infinity')).toBeNull();
  });
});

describe('known 72 by 96 inch sample', () => {
  test('preserves weight, diameter, and deflection', () => {
    expect(totalWeightLb(completeInputs)).toBeCloseTo(3.8451846784, 8);
    expect(totalWeightKg(completeInputs)).toBeCloseTo(1.7441485056, 8);
    expect(rollerDiameterInch(completeInputs)).toBeCloseTo(1.5738253869, 8);
    expect(rollerDiameterMm(completeInputs)).toBeCloseTo(39.9752447785, 8);
    expect(tubeDeflectionInch(completeInputs)).toBeCloseTo(0.1269037064, 8);
    expect(tubeDeflectionMm(completeInputs)).toBeCloseTo(3.2233605892, 8);
  });
});
