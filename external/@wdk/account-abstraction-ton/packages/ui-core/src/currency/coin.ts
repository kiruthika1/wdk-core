import {BaseCurrency} from './baseCurrency';
import type {Currency} from './currency';

/**
 * Represents an Coin with some metadata.
 */
export class Coin extends BaseCurrency {
  protected constructor(chainKey: string, decimals: number, symbol: string, name?: string) {
    super(String(chainKey), chainKey, decimals, symbol, name);
  }
  /**
   * Returns true if the two Coins are equivalent, i.e. have the same chainKey
   * @param other other currency to compare
   */
  public equals(other: Currency): boolean {
    if (!(other instanceof Coin)) return false;
    return this.chainKey === other.chainKey;
  }

  public static from(input: {chainKey: string; decimals: number; symbol: string; name?: string}) {
    return new Coin(input.chainKey, input.decimals, input.symbol, input.name);
  }
}
