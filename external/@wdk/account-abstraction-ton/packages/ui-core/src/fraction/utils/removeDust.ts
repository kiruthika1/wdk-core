import {CurrencyAmount} from '../currencyAmount';

export function removeDust(amount: CurrencyAmount, sharedDecimals: number) {
  const localDecimals = amount.token.decimals;
  const diff = localDecimals - sharedDecimals;
  if (diff > 0) {
    return CurrencyAmount.fromBigInt(
      //
      amount.token,
      amount.divide(10 ** diff).quotient,
    ).multiply(10 ** diff);
  }
  return amount;
}
