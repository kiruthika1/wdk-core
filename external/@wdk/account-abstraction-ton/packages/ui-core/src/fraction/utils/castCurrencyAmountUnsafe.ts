import type {Currency} from '../../currency';
import {CurrencyAmount} from '../currencyAmount';

export function castCurrencyAmountUnsafe(
  input: CurrencyAmount,
  dstToken: Currency,
): CurrencyAmount {
  const srcToken = input.token;
  if (srcToken.decimals === dstToken.decimals) {
    return CurrencyAmount.fromBigInt(dstToken, input.quotient);
  }
  return CurrencyAmount.fromBigInt(dstToken, input.quotient)
    .multiply(10 ** dstToken.decimals)
    .divide(10 ** srcToken.decimals);
}
