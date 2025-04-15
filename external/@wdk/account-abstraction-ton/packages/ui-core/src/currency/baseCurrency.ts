import {assert} from '../utils/assert';
import type {Currency} from './currency';

/**
 * A currency is any fungible financial instrument, including all ERC20 tokens
 */
export abstract class BaseCurrency {
  /**
   * The layerzero chain key on which this currency resides
   */
  public readonly chainKey: string;
  /**
   * The decimals used in representing currency amounts
   */
  public readonly decimals: number;
  /**
   * The symbol of the currency, i.e. a short textual non-unique identifier
   */
  public readonly symbol: string;
  /**
   * The name of the currency, i.e. a descriptive textual non-unique identifier
   */
  public readonly name?: string;

  /**
   * The id of the token used for comparisons
   */
  public readonly id!: string;

  /**
   * Constructs an instance of the base class `BaseCurrency`.
   * @param chainKey the chain key on which this currency resides
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(
    id: string,
    chainKey: string,
    decimals: number,
    symbol: string,
    name?: string,
  ) {
    assert(decimals >= 0 && decimals < 255 && Number.isInteger(decimals), 'DECIMALS');

    Object.defineProperty(this, 'id', {
      enumerable: false,
      writable: false,
      value: id,
    });
    this.chainKey = chainKey;
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
  }

  /**
   * Returns whether this currency is functionally equivalent to the other currency
   * @param other the other currency
   */
  public abstract equals(other: Currency): boolean;
}
