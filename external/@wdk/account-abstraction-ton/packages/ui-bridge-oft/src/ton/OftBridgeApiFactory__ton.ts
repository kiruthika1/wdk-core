import {TonClient} from '@ton/ton';
import {OftBridgeConfig} from '../types';
import {OftBridgeV3__ton} from './OftBridgeV3__ton';
import {AddressConfig, LoadedUlnConfig} from './types';

export class OftBridgeApiFactory__ton {
  constructor(
    protected readonly client: TonClient,
    protected readonly addressConfig: AddressConfig,
    protected readonly ulnConfigs: Record<string, LoadedUlnConfig>,
  ) {}
  create(config: OftBridgeConfig): OftBridgeV3__ton {
    const impl =
      config.version === 3
        ? new OftBridgeV3__ton(this.client, config, this.addressConfig, this.ulnConfigs)
        : undefined;
    if (!impl) {
      throw new Error('Unsupported Config version');
    }
    return impl;
  }
}
