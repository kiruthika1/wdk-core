import {isChainType} from '../utils/globals';
import type {ChainKey} from '../types/ChainKey';
import {ChainType} from '../types/ChainType';

export function isTronChainKey(chainKey: ChainKey): boolean {
  return isChainType(chainKey, ChainType.TRON) || chainKey.startsWith('tron-');
}
