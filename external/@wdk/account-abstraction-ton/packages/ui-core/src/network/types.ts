import type {Currency} from '../currency';
import type {ChainKey} from '../types/ChainKey';
import type {ChainType} from '../types/ChainType';

export interface Network {
  name: string;
  shortName: string;
  chainKey: ChainKey;
  chainType: ChainType;
  nativeChainId: number | string;
  nativeCurrency: Currency;
}

export interface NetworkInfo {
  name: string;
  shortName: string;
  chainKey: ChainKey;
  chainType: ChainType;
  nativeChainId: number | string;
  nativeCurrency: {name: string; symbol: string; decimals: number; address?: string};
}

export interface BlockExplorer {
  name?: string;
  url: string;
  standard?: string;
  isPublic?: boolean;
  isActive?: boolean;
}
