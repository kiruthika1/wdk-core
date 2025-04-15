import type {CurrencyAmount} from '../fraction/currencyAmount';
import type {ChainKey} from '../types/ChainKey';

export interface DstNativeProvider {
  getMaxAmount(path: GeMaxAmountInput): Promise<CurrencyAmount>;
  getDefaultAmount(path: GetDefaultAmountInput): Promise<CurrencyAmount>;
}

interface GeMaxAmountInput {
  srcChainKey: ChainKey;
  dstChainKey: ChainKey;
}

interface GetDefaultAmountInput {
  dstChainKey: ChainKey;
}
