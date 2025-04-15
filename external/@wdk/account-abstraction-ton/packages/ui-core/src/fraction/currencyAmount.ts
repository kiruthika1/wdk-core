import type {Currency} from '../currency/currency';
import {Fraction} from './fraction';
import _Big from 'big.js';

import toFormat from 'toformat';
import {type BigintIsh, Rounding, MaxUint256} from './constants';
import {assert} from '../utils/assert';

const Big = toFormat(_Big);

interface Format {
  decimalSeparator?: string;
  secondaryGroupSize?: number;
  fractionGroupSeparator?: string;
  groupSize?: number;
  groupSeparator?: string;
}

const defaultFormat: Format = {
  decimalSeparator: '.',
  groupSeparator: '',
};

export class CurrencyAmount<T extends Currency = Currency> extends Fraction {
  public readonly token: T;
  public readonly decimalScale: bigint;

  /**
   * Returns a new currency amount instance from the unitless amount of token, i.e. the raw amount
   * @param currency the currency in the amount
   * @param rawAmount the raw token or ether amount
   */
  public static fromRawAmount<T extends Currency>(
    currency: T,
    rawAmount: BigintIsh,
  ): CurrencyAmount<T> {
    return new CurrencyAmount(currency, rawAmount);
  }

  /**
   * Construct a currency amount with a denominator that is not equal to 1
   * @param currency the currency
   * @param numerator the numerator of the fractional token amount
   * @param denominator the denominator of the fractional token amount
   */
  public static fromFractionalAmount<T extends Currency>(
    currency: T,
    numerator: BigintIsh,
    denominator: BigintIsh,
  ): CurrencyAmount<T> {
    return new CurrencyAmount(currency, numerator, denominator);
  }

  protected constructor(currency: T, numerator: BigintIsh, denominator?: BigintIsh) {
    super(numerator, denominator);
    assert(this.quotient <= MaxUint256, 'AMOUNT');
    this.token = currency;
    this.decimalScale = BigInt(10) ** BigInt(currency.decimals);
  }

  public add(other: CurrencyAmount<T>): CurrencyAmount<T> {
    assert(this.token.equals(other.token), 'CURRENCY');
    const added = super.add(other);
    return CurrencyAmount.fromFractionalAmount(this.token, added.numerator, added.denominator);
  }

  public subtract(other: CurrencyAmount<T>): CurrencyAmount<T> {
    assert(this.token.equals(other.token), 'CURRENCY');
    const subtracted = super.subtract(other);
    return CurrencyAmount.fromFractionalAmount(
      this.token,
      subtracted.numerator,
      subtracted.denominator,
    );
  }

  public multiply(other: Fraction | BigintIsh): CurrencyAmount<T> {
    const multiplied = super.multiply(other);
    return CurrencyAmount.fromFractionalAmount(
      this.token,
      multiplied.numerator,
      multiplied.denominator,
    );
  }

  public divide(other: Fraction | BigintIsh): CurrencyAmount<T> {
    const divided = super.divide(other);
    return CurrencyAmount.fromFractionalAmount(this.token, divided.numerator, divided.denominator);
  }

  public toSignificant(
    significantDigits: number = 6,
    format?: Format,
    rounding: Rounding = Rounding.ROUND_DOWN,
  ): string {
    return super.divide(this.decimalScale).toSignificant(significantDigits, format, rounding);
  }

  public toFixed(
    decimalPlaces: number = this.token.decimals,
    format?: Format,
    rounding: Rounding = Rounding.ROUND_DOWN,
  ): string {
    assert(decimalPlaces <= this.token.decimals, 'DECIMALS');
    return super.divide(this.decimalScale).toFixed(decimalPlaces, format, rounding);
  }

  public toExact(format: Format = defaultFormat): string {
    Big.DP = this.token.decimals;
    return new Big(this.quotient.toString()).div(this.decimalScale.toString()).toFormat(format);
  }

  public get asFraction(): Fraction {
    return new Fraction(this.numerator, this.denominator).divide(this.decimalScale);
  }

  public static fromBigInt<T extends Currency>(currency: T, bigIntAmount: bigint) {
    return new CurrencyAmount(currency, bigIntAmount);
  }

  public toBigInt(): bigint {
    return this.quotient;
  }
}
