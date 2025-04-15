import type {Currency} from '../../currency';
import type {CurrencyAmount} from '../currencyAmount';
import {tryParseCurrencyAmount} from './parseCurrencyAmount';

export function sumUnsafe(amounts?: (CurrencyAmount | undefined)[], asCurrency?: Currency) {
  if (!amounts || amounts.length === 0 || amounts.some((i) => !i)) {
    return undefined;
  }
  asCurrency = asCurrency ?? amounts[0]!.token;
  let sum = 0;
  for (const amount of amounts as CurrencyAmount[]) {
    const float = Number.parseFloat(amount.toExact());
    sum += float;
  }
  if (!Number.isFinite(sum)) return undefined;
  return tryParseCurrencyAmount(asCurrency, sum.toFixed(asCurrency.decimals));
}
