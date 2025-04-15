export const FiatCurrency = {
  USD: 'USD',
  EUR: 'EUR',
} as const;

export type FiatCurrency = keyof typeof FiatCurrency;
export type FiatAmount = {
  currency: FiatCurrency;
  value: number;
};
