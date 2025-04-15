import {AdapterParams, ChainKey, isTonChainKey} from '@wdk-account-abstraction-ton/ui-core';
import type {OftBridgeDeployment, OftBridgeConfig} from './types';
import {Options, addressToBytes32} from '@wdk-account-abstraction-ton/ui-evm';
import {utils} from 'ethers';
import {isTronChainKey} from '@wdk-account-abstraction-ton/ui-core';
import {toHexAddress} from '@wdk-account-abstraction-ton/ui-tron';
import {toHex} from 'tron-format-address';
import {parseTonAddress} from '@wdk-account-abstraction-ton/ui-ton';
import {replace} from 'lodash-es';

type CreateOptionsOverrides = {
  executorLzReceiveOption?: OftBridgeDeployment['executorLzReceiveOption'];
};

export function createOptions(
  {dstChainKey, adapterParams}: {dstChainKey: ChainKey; adapterParams: AdapterParams},
  config: OftBridgeConfig,
  {executorLzReceiveOption}: CreateOptionsOverrides = {},
) {
  const dstDeployment = getDeployment(dstChainKey, config);
  const options = Options.newOptions();

  executorLzReceiveOption = executorLzReceiveOption ?? dstDeployment.executorLzReceiveOption;

  if (executorLzReceiveOption?.gasLimit) {
    options.addExecutorLzReceiveOption(
      executorLzReceiveOption.gasLimit,
      executorLzReceiveOption.nativeValue,
    );
  }

  if (adapterParams.version === 2 && adapterParams.dstNativeAmount?.greaterThan(0)) {
    const {dstNativeAddress, dstNativeAmount} = adapterParams;
    if (!dstNativeAddress) throw new Error('No dstNativeAddress');

    options.addExecutorNativeDropOption(
      dstNativeAmount.toBigInt(),
      utils.hexlify(addressToBytes32(dstNativeAddress)),
    );
  }

  return options;
}

export function tryGetDeployment(
  chainKey: ChainKey,
  config: OftBridgeConfig,
): OftBridgeDeployment | undefined {
  return config.deployments[chainKey];
}

export function getDeployment(chainKey: ChainKey, config: OftBridgeConfig) {
  const deployment = tryGetDeployment(chainKey, config);
  if (deployment) return deployment;
  throw new Error(`No deployment found for chainKey: ${chainKey}`);
}

export function addressToBytes32ForChain(address: string, chainKey: ChainKey): string {
  if (isTronChainKey(chainKey)) {
    // For Tron addresses, first convert to hex format
    const hexAddress = toHexAddress(address);
    // Then pad to bytes32
    return utils.hexlify(utils.hexZeroPad(hexAddress, 32));
  }
  // For other chains, use existing conversion
  return utils.hexlify(addressToBytes32(address));
}
