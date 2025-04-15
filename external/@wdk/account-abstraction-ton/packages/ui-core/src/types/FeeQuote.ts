import type {CurrencyAmount} from '../fraction/currencyAmount';

export type FeeQuote = {
  zroFee: CurrencyAmount;
  nativeFee: CurrencyAmount;
};
