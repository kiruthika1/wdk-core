import type {Currency} from '../../currency';
import type {CurrencyAmount} from '../currencyAmount';
import {parseCurrencyAmount, tryParseCurrencyAmount} from './parseCurrencyAmount';

export function parseAmount<TToken extends Currency = Currency>(
  amount: string,
  token: TToken,
): CurrencyAmount<TToken> {
  return parseCurrencyAmount(token, amount);
}

export function tryParseAmount<TToken extends Currency = Currency>(
  amount?: string,
  token?: TToken,
): CurrencyAmount<TToken> | undefined {
  return tryParseCurrencyAmount(token, amount);
}
