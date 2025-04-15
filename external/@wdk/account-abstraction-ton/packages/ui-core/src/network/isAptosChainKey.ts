import {isChainType} from '../utils/globals';
import type {ChainKey} from '../types/ChainKey';
import {ChainType} from '../types/ChainType';

export function isAptosChainKey(chainKey: ChainKey): boolean {
  return isChainType(chainKey, ChainType.APTOS);
}
