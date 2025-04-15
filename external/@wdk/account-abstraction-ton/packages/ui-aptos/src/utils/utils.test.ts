import {test, expect, describe} from 'vitest';
import {buildAirdropAdapterParams, buildDefaultAdapterParams, decodeAdapterParams} from './utils';

describe('decodeAdapterParams', () => {
  test('type 1', () => {
    const encoded = buildDefaultAdapterParams(123n);
    const decoded = decodeAdapterParams(encoded);
    const [type, uaGas] = decoded;
    expect(type).toBe(1);
    expect(uaGas).toBe(123n);
  });

  test('type 2', () => {
    const airdropAddress = '0x0000000000000000000000000000000000000000';
    const encoded = buildAirdropAdapterParams(123n, 456n, airdropAddress);
    const decoded = decodeAdapterParams(encoded);
    const [type, uaGas, airdropAmount] = decoded;
    expect(type).toBe(2);
    expect(uaGas).toBe(123n);
    expect(airdropAmount).toBe(456n);
    expect(decoded[3]).toBe(airdropAddress);
  });
});
