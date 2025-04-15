import type {ChainKey} from '@wdk-account-abstraction-ton/ui-core';

export type AptosNetworkConfigs = Partial<Record<ChainKey, AptosNetworkConfig>>;

export interface AptosNetworkConfig {
  nodeUrl: string;
  executorAccount: string;
}
