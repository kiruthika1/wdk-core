import type {FiatAmount} from '../fiat';

export function sumFiat(amounts?: (FiatAmount | undefined)[]): FiatAmount | undefined {
  if (!amounts || amounts.length === 0) return undefined;
  let sum = 0;
  const currency = amounts[0]!.currency;
  for (const amount of amounts) {
    if (!amount) return undefined;
    if (currency !== amount.currency) return undefined;
    sum += amount.value;
  }
  if (!Number.isFinite(sum)) return undefined;
  return {
    currency,
    value: sum,
  };
}
