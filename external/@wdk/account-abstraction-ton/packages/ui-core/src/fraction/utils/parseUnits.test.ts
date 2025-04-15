import {describe, it, expect} from 'vitest';
import {parseUnits} from './parseUnits';

describe('parseUnits', () => {
  it('throws when too many decimals', () => {
    expect(() => parseUnits('1.12345', 4)).toThrowError('Too many decimal places');
  });

  it('returns the correct value', () => {
    expect(parseUnits('1.1234', 4)).toEqual(BigInt(11234));
    expect(parseUnits('1.0000', 4)).toEqual(BigInt(10000));
    expect(parseUnits('1', 4)).toEqual(BigInt(10000));
  });
});
