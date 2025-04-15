import type {OftBridgeConfig} from '../types';
import type {OftBridgeBase} from '../evm/impl/OftBridgeBase';
import {OftBridgeV3__tron} from './OftBridgeV3__tron';
import type {TronWebProvider} from './types';
import type {ChainKey} from '@wdk-account-abstraction-ton/ui-core';

export class OftBridgeApiFactory__tron {
  constructor(protected getTronWeb: (chainKey: ChainKey) => Promise<TronWebProvider>) {}
  create(config: OftBridgeConfig): OftBridgeBase {
    const impl = config.version === 3 ? new OftBridgeV3__tron(this.getTronWeb, config) : undefined;
    if (!impl) {
      throw new Error(
        `Unsupported config: Tron only supports {version: 3}, got {version: ${config.version}, fee: ${config.fee}}`,
      );
    }
    return impl;
  }
}
