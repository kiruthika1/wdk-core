import type {CurrencyAmount} from '../fraction/currencyAmount';
import {assert} from '../utils/assert';

export class AdapterParams {
  private constructor(
    public readonly version: number,
    public readonly extraGas = 200_000,
    public readonly dstNativeAmount?: CurrencyAmount,
    public readonly dstNativeAddress?: string,
  ) {}

  static forV1(extraGas?: number): AdapterParams {
    return new AdapterParams(1, extraGas);
  }

  static forV2(input: AdapterParamsV2Input): AdapterParams {
    assert(input.dstNativeAmount);
    assert(input.dstNativeAddress);
    return new AdapterParams(2, input.extraGas, input.dstNativeAmount, input.dstNativeAddress);
  }

  static create(input: AdapterParamsV1Input | AdapterParamsV2Input): AdapterParams {
    if ('dstNativeAmount' in input && input.dstNativeAmount) {
      return AdapterParams.forV2(input);
    } else {
      return AdapterParams.forV1(input.extraGas);
    }
  }
}

type AdapterParamsV1Input = {
  extraGas?: number;
};

type AdapterParamsV2Input = {
  extraGas?: number;
  dstNativeAmount: CurrencyAmount;
  dstNativeAddress: string;
};
