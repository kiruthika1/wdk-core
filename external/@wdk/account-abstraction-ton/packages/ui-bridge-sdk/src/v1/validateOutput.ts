import {assert, type CurrencyAmount, type Currency} from '@wdk-account-abstraction-ton/ui-core';
import type {BridgeFeeBase, BridgeOutput} from './types';

export function validateOutput<BridgeFee extends BridgeFeeBase>(
  srcAmount: CurrencyAmount,
  dstToken: Currency,
  quote: BridgeOutput<BridgeFee>,
) {
  assert(quote.dstAmount.token.equals(dstToken));
}
