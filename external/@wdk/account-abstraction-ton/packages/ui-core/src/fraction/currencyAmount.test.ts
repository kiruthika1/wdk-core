import {MaxUint256} from './constants';
import {Token} from '../currency/token';
import {CurrencyAmount} from './currencyAmount';
import {Percent} from './percent';

import {describe, it, expect} from 'vitest';

describe('CurrencyAmount', () => {
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

  describe('constructor', () => {
    it('works', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 18,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 100);
      expect(amount.quotient).toEqual(BigInt(100));
    });
  });

  describe('#quotient', () => {
    it('returns the amount after multiplication', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 18,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 100).multiply(new Percent(15, 100));
      expect(amount.quotient).toEqual(BigInt(15));
    });
  });

  it('token amount can be max uint256', () => {
    const amount = CurrencyAmount.fromRawAmount(
      Token.from({chainKey: 'ethereum', address: ADDRESS_ONE, decimals: 18, symbol: 'TEST'}),
      MaxUint256,
    );
    expect(amount.quotient).toEqual(MaxUint256);
  });
  it('token amount cannot exceed max uint256', () => {
    expect(() =>
      CurrencyAmount.fromRawAmount(
        Token.from({chainKey: 'ethereum', address: ADDRESS_ONE, decimals: 18, symbol: 'TEST'}),
        MaxUint256 + BigInt(1),
      ),
    ).toThrow('AMOUNT');
  });
  it('token amount quotient cannot exceed max uint256', () => {
    expect(() =>
      CurrencyAmount.fromFractionalAmount(
        Token.from({chainKey: 'ethereum', address: ADDRESS_ONE, decimals: 18, symbol: 'TEST'}),
        MaxUint256 * BigInt(2) + BigInt(2),
        BigInt(2),
      ),
    ).toThrow('AMOUNT');
  });
  it('token amount numerator can be gt. uint256 if denominator is gt. 1', () => {
    const amount = CurrencyAmount.fromFractionalAmount(
      Token.from({chainKey: 'ethereum', address: ADDRESS_ONE, decimals: 18, symbol: 'TEST'}),
      MaxUint256 + BigInt(2),
      2,
    );
    expect(amount.numerator).toEqual(MaxUint256 + BigInt(2));
  });

  describe('#toFixed', () => {
    it('throws for decimals > currency.decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 1000);
      expect(() => amount.toFixed(3)).toThrow('DECIMALS');
    });
    it('is correct for 0 decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 123456);
      expect(amount.toFixed(0)).toEqual('123456');
    });
    it('is correct for 18 decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 18,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 1e15);
      expect(amount.toFixed(9)).toEqual('0.001000000');
    });
  });

  describe('#toSignificant', () => {
    it('does not throw for sig figs > currency.decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 1000);
      expect(amount.toSignificant(3)).toEqual('1000');
    });
    it('is correct for 0 decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 123456);
      expect(amount.toSignificant(4)).toEqual('123400');
    });
    it('is correct for 18 decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 18,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 1e15);
      expect(amount.toSignificant(9)).toEqual('0.001');
    });
  });

  describe('#toExact', () => {
    it('does not throw for sig figs > currency.decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 1000);
      expect(amount.toExact()).toEqual('1000');
    });
    it('is correct for 0 decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 123456);
      expect(amount.toExact()).toEqual('123456');
    });
    it('is correct for 18 decimals', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 18,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 123e13);
      expect(amount.toExact()).toEqual('0.00123');
    });
  });

  describe('#asFraction', () => {
    it('should match Fraction.asFraction if decimalScale is 1', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 0,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 123456);

      expect(amount.asFraction.toFixed(18)).toEqual('123456.000000000000000000');
    });

    it('should offset the result by the decimal scale', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ONE,
        decimals: 18,
        symbol: 'TEST',
      });
      const amount = CurrencyAmount.fromRawAmount(token, 123456);

      expect(amount.asFraction.toFixed(18)).toEqual('0.000000000000123456');
    });
  });
});
