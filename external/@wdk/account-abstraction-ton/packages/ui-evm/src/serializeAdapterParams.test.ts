import {AdapterParams, getNativeCurrency, parseCurrencyAmount} from '@wdk-account-abstraction-ton/ui-core';
import {describe, test, expect} from 'vitest';
import {serializeAdapterParams} from './serializeAdapterParams';
import {ONE_ADDRESS} from './constants';

describe('serializeAdapterParams', () => {
  test('V1', () => {
    const adapterParamsV1 = AdapterParams.forV1(10_000);
    const serializedV1 = serializeAdapterParams(adapterParamsV1);
    expect(serializedV1).toBe(
      '0x00010000000000000000000000000000000000000000000000000000000000002710',
    );
  });
  test('V2', () => {
    const dstNativeAmount = parseCurrencyAmount(getNativeCurrency('ethereum'), '0.123');
    const adapterParamsV2 = AdapterParams.forV2({
      dstNativeAddress: ONE_ADDRESS,
      dstNativeAmount,
      extraGas: 10_000,
    });
    const serializedV2 = serializeAdapterParams(adapterParamsV2);
    expect(serializedV2).toBe(
      '0x0002000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000001b4fbd92b5f80000000000000000000000000000000000000000001',
    );
  });
});
