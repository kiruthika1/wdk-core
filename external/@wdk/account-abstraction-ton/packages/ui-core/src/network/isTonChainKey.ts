import type {ChainKey} from '../types/ChainKey';
import {ChainType} from '../types/ChainType';

export function isTonChainKey(chainKey: ChainKey): boolean {
  return chainKey === 'ton' || chainKey.startsWith('ton-');
}
