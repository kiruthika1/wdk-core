import z from 'zod';
import type {Currency} from './currency';
import {Token} from './token';
import {Coin} from './coin';
import {CurrencyAmount} from '../fraction';

export const serializedCoinSchema = z.object({
  name: z.string().optional(),
  symbol: z.string(),
  decimals: z.number(),
  chainKey: z.string(),
});

export const serializedTokenSchema = z.object({
  name: z.string().optional(),
  symbol: z.string(),
  decimals: z.number(),
  chainKey: z.string(),
  address: z.string(),
});

export const serializedCurrencySchema = z.union([
  // order matters
  serializedTokenSchema,
  serializedCoinSchema,
]);

export const serializedAmountSchema = z.object({
  // as bigint
  amount: z.string(),
  token: serializedCurrencySchema,
});

export type SerializedCoin = z.infer<typeof serializedCoinSchema>;
export type SerializedToken = z.infer<typeof serializedTokenSchema>;
export type SerializedAmount = z.infer<typeof serializedAmountSchema>;
export type SerializedCurrency = z.infer<typeof serializedCurrencySchema>;

export const coinSchema: z.ZodSchema<Coin, z.ZodTypeDef, SerializedCoin> =
  serializedCoinSchema.transform((obj) => Coin.from(obj));

export const tokenSchema: z.ZodSchema<Token, z.ZodTypeDef, SerializedToken> =
  serializedTokenSchema.transform((obj) => Token.from(obj));

export const currencySchema: z.ZodSchema<Currency, z.ZodTypeDef, SerializedCurrency> = z.union([
  // order matters
  tokenSchema,
  coinSchema,
]);

export const amountSchema: z.ZodSchema<CurrencyAmount, z.ZodTypeDef, SerializedAmount> =
  serializedAmountSchema.transform((obj) => {
    const token = currencySchema.parse(obj.token);
    const amount = BigInt(obj.amount);
    return CurrencyAmount.fromBigInt(token, amount);
  });

export function serializeToken(token: Token): SerializedToken {
  return {
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    chainKey: token.chainKey,
    address: token.address,
  };
}

export function serializeCoin(coin: Coin): SerializedCoin {
  return {
    name: coin.name,
    symbol: coin.symbol,
    decimals: coin.decimals,
    chainKey: coin.chainKey,
  };
}

export function serializeCurrency(currency: Currency): SerializedCurrency {
  if ('address' in currency) {
    return serializeToken(currency);
  } else {
    return serializeCoin(currency);
  }
}

export function serializeAmount(amount: CurrencyAmount): SerializedAmount {
  return {
    amount: amount.toBigInt().toString(),
    token: serializeCurrency(amount.token),
  };
}
