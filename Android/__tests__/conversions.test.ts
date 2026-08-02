import {
  bottomBarFromInputs,
  fabricFromInputs,
  tubeFromInputs,
} from '../src/conversions';

describe('custom item conversions', () => {
  test('converts fabric imperial inputs', () => {
    const fabric = fabricFromInputs('Solar', 12, 0.02);
    expect(fabric.name).toBe('Solar');
    expect(fabric.weight).toBeCloseTo(406.872, 10);
    expect(fabric.thickness).toBeCloseTo(0.508, 10);
  });

  test('converts a 1.5 by 0.055 inch tube', () => {
    const tube = tubeFromInputs('Tube', 1.5, 0.055);
    expect(tube.diameter).toBeCloseTo(38.1, 10);
    expect(tube.thickness).toBeCloseTo(1.397, 10);
    expect(tube.moment).toBeCloseTo(0.065261, 5);
    expect(tube.weight).toBeCloseTo(0.29198, 4);
  });

  test('converts bottom-bar linear weight', () => {
    expect(bottomBarFromInputs('Bar', 0.4)).toEqual({
      name: 'Bar',
      weightLbFt: 0.4,
      weightGM: 595.264,
    });
  });
});
