import type {Currency} from '../currency';
import type {FiatAmount, FiatCurrency} from '../fraction';

export type PriceProvider = {
  getCurrentPrice(token: Currency, fiatCurrency: FiatCurrency): Promise<FiatAmount>;
};
