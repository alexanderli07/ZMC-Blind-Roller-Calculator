import {
  validateBottomBarInput,
  validateFabricInput,
  validateTubeInput,
} from '../src/validation';

describe('custom item validation', () => {
  test('rejects an empty name', () => {
    expect(validateFabricInput(
      { name: '   ', weight: '12.5', thickness: '0.03' },
      []
    )).toEqual({ ok: false, error: 'Name is required.' });
  });

  test('trims and parses a valid fabric', () => {
    expect(validateFabricInput(
      { name: '  Solar  ', weight: '12.5', thickness: '0.03' },
      ['deluxe']
    )).toEqual({
      ok: true,
      value: { name: 'Solar', weight: 12.5, thickness: 0.03 },
    });
  });

  test('rejects duplicate names case-insensitively', () => {
    expect(validateFabricInput(
      { name: ' DELUXE ', weight: '12.5', thickness: '0.03' },
      ['deluxe']
    )).toEqual({ ok: false, error: 'An item with this name already exists.' });
  });

  test('rejects duplicate names persisted with legacy whitespace', () => {
    expect(validateFabricInput(
      { name: 'solar', weight: '12.5', thickness: '0.03' },
      [' Solar ']
    )).toEqual({ ok: false, error: 'An item with this name already exists.' });
  });

  test.each(['abc', '0', '-1', 'Infinity'])('rejects fabric weight %p', (weight) => {
    const result = validateFabricInput({ name: 'Solar', weight, thickness: '0.03' }, []);
    expect(result).toEqual({ ok: false, error: 'Weight must be a number greater than 0.' });
  });

  test('rejects tube thickness that removes the inner diameter', () => {
    expect(validateTubeInput(
      { name: 'Tube', diameter: '1.5', thickness: '0.75' },
      []
    )).toEqual({ ok: false, error: 'Thickness must be less than half the diameter.' });
  });

  test('rejects nonpositive fabric thickness', () => {
    expect(validateFabricInput(
      { name: 'Solar', weight: '12.5', thickness: '0' },
      []
    )).toEqual({ ok: false, error: 'Thickness must be a number greater than 0.' });
  });

  test('rejects fabric values that overflow during conversion', () => {
    expect(validateFabricInput(
      { name: 'Solar', weight: '1e308', thickness: '0.03' },
      []
    )).toEqual({ ok: false, error: 'Values are outside the supported calculation range.' });
  });

  test('rejects a nonnumeric tube diameter', () => {
    expect(validateTubeInput(
      { name: 'Tube', diameter: 'wide', thickness: '0.05' },
      []
    )).toEqual({ ok: false, error: 'Diameter must be a number greater than 0.' });
  });

  test('rejects tube values that collapse during conversion', () => {
    expect(validateTubeInput(
      { name: 'Tube', diameter: '1', thickness: '5e-324' },
      []
    )).toEqual({ ok: false, error: 'Values are outside the supported calculation range.' });
  });

  test('parses a valid bottom bar', () => {
    expect(validateBottomBarInput(
      { name: 'Bar', weightLbFt: '0.4' },
      []
    )).toEqual({ ok: true, value: { name: 'Bar', weightLbFt: 0.4 } });
  });

  test('rejects nonpositive bottom-bar weight', () => {
    expect(validateBottomBarInput(
      { name: 'Bar', weightLbFt: '-0.4' },
      []
    )).toEqual({ ok: false, error: 'Weight must be a number greater than 0.' });
  });

  test('rejects bottom-bar values that overflow during conversion', () => {
    expect(validateBottomBarInput(
      { name: 'Bar', weightLbFt: '1e308' },
      []
    )).toEqual({ ok: false, error: 'Values are outside the supported calculation range.' });
  });
});
