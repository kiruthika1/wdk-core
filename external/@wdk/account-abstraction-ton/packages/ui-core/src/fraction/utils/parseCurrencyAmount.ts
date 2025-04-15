import type {Currency} from '../../currency';
import {CurrencyAmount} from '../currencyAmount';
import {parseUnits} from './parseUnits';

export function parseCurrencyAmount<T extends Currency>(
  currency: T,
  value: string,
): CurrencyAmount<T> {
  const typedValueParsed = parseUnits(value, currency.decimals);
  return CurrencyAmount.fromRawAmount(currency, typedValueParsed);
}

export function tryParseCurrencyAmount<T extends Currency>(
  currency?: T,
  value?: string,
): CurrencyAmount<T> | undefined {
  if (currency === undefined || value === undefined) return undefined;
  try {
    return parseCurrencyAmount(currency, value);
  } catch {
    //
  }
  return undefined;
}
