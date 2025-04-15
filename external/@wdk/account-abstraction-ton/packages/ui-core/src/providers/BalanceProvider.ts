import type {Currency} from '../currency';
import type {CurrencyAmount} from '../fraction';

export type BalanceProvider = {
  supports(token: Currency): boolean;
  getBalance(token: Currency, address: string): Promise<CurrencyAmount>;
};
