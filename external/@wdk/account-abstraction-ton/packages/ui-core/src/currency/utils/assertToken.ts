import {Coin} from '../coin';
import type {Currency} from '../currency';
import {Token} from '../token';

export function isToken(value: unknown): value is Token {
  return value instanceof Token;
}

export function assertToken(value: Currency, errorMessage?: string): asserts value is Token {
  if (!isToken(value)) {
    throw new Error(errorMessage ?? `Not a token (${value.symbol})`);
  }
}

export function isCoin(value: Currency): value is Coin {
  return value instanceof Coin;
}

export function isCurrency(value: unknown): value is Currency {
  return value instanceof Token || value instanceof Coin;
}
