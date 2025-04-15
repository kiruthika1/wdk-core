import {CurrencyAmount} from '../fraction/currencyAmount';
import {getNativeCurrency} from '../utils/globals';
import type {ChainKey} from './ChainKey';
import type {FeeQuote} from './FeeQuote';

export class MessageFee implements FeeQuote {
  protected constructor(
    public readonly nativeFee: CurrencyAmount,
    public readonly zroFee: CurrencyAmount,
  ) {}

  static from(
    chainKey: ChainKey,
    {nativeFee, zroFee}: {nativeFee: number | string | bigint; zroFee: number | string | bigint},
  ): MessageFee {
    const native = getNativeCurrency(chainKey);
    const zroToken = native; // dummy token
    return new MessageFee(
      CurrencyAmount.fromBigInt(native, BigInt(nativeFee)),
      CurrencyAmount.fromBigInt(zroToken, BigInt(zroFee)),
    );
  }
}
