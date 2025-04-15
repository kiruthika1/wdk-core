import type {FiatCurrency} from '../fraction/fiat';

export type TokenList<TItem = TokenListItem> = TItem[];

export type TokenListItem = {
  price: Partial<Record<FiatCurrency, number | null>>;
  address?: string | undefined;
  decimals: number;
  chainKey: string;
  name?: string;
  icon?: string;
  symbol: string;
};
