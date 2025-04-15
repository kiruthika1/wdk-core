import type {ProviderFactory} from '@wdk-account-abstraction-ton/ui-evm';
import type {OftBridgeConfig} from '../types';
import type {OftBridgeBase} from './impl/OftBridgeBase';
import {OftBridgeV0} from './impl/OftBridgeV0';
import {OftBridgeV1} from './impl/OftBridgeV1';
import {OftBridgeV2} from './impl/OftBridgeV2';
import {OftBridgeV2Fee} from './impl/OftBridgeV2Fee';
import {OftBridgeV3} from './impl/OftBridgeV3';

export class OftBridgeApiFactory__evm {
  constructor(protected providerFactory: ProviderFactory) {}
  create(config: OftBridgeConfig): OftBridgeBase {
    const impl =
      config.version === 0 && config.fee === false
        ? new OftBridgeV0(this.providerFactory, config)
        : config.version === 1 && config.fee === false
          ? new OftBridgeV1(this.providerFactory, config)
          : config.version === 2 && config.fee === false
            ? new OftBridgeV2(this.providerFactory, config)
            : config.version === 2 && config.fee === true
              ? new OftBridgeV2Fee(this.providerFactory, config)
              : config.version === 3
                ? new OftBridgeV3(this.providerFactory, config)
                : undefined;
    if (!impl) {
      throw new Error(
        `Unsupported config: EVM supports: {version: 0, fee: false} | {version: 1, fee: false} | {version: 2, fee: false} | {version: 2, fee: true} got {version: ${config.version}, fee: ${config.fee}}`,
      );
    }
    return impl;
  }
}
