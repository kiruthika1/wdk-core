import {validateAndParseAddress} from './utils/validateAndParseAddress';
import {BaseCurrency} from './baseCurrency';
import type {Currency} from './currency';

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends BaseCurrency {
  /**
   * The contract address on the chain on which this token lives
   */
  public readonly address: string;

  protected constructor(
    chainKey: string,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
  ) {
    address = validateAndParseAddress(address, chainKey);
    super(`${chainKey}:${address}`, chainKey, decimals, symbol, name);
    this.address = address;
  }

  public static from(input: {
    chainKey: string;
    address: string;
    decimals: number;
    symbol: string;
    name?: string;
  }) {
    return new Token(input.chainKey, input.address, input.decimals, input.symbol, input.name);
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainKey and address.
   * @param other other token to compare
   */
  public equals(other: Currency): boolean {
    if (!(other instanceof Token)) return false;
    return this.chainKey === other.chainKey && this.address === other.address;
  }
}
