import {assert, type AdapterParams} from '@wdk-account-abstraction-ton/ui-core';
import {utils} from 'ethers';

export function serializeAdapterParams(adapterParams: AdapterParams): string {
  if (adapterParams.version === 1) {
    // special case - default extra gas = 0
    // means useCustomAdapterParams is set to false
    // and the contract will fail if anything else than
    // 0x is provided
    if (adapterParams.extraGas === 0) {
      return '0x';
    }
    return utils.solidityPack(['uint16', 'uint256'], [1, adapterParams.extraGas]);
  } else {
    assert(adapterParams.dstNativeAmount);
    return utils.solidityPack(
      ['uint16', 'uint', 'uint', 'address'],
      [
        2,
        adapterParams.extraGas,
        adapterParams.dstNativeAmount.quotient,
        adapterParams.dstNativeAddress,
      ],
    );
  }
}
