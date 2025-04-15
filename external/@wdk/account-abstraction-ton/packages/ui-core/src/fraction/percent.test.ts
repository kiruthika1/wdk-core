import {Percent} from './percent';
import {describe, it, expect} from 'vitest';
import {parsePercent, tryParsePercent} from './utils/parsePercent';
import {Fraction} from './fraction';

describe('Percent', () => {
  describe('constructor', () => {
    it('defaults to 1 denominator', () => {
      expect(new Percent(1)).toEqual(new Percent(1, 1));
    });
  });
  describe('#add', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).add(new Percent(2, 100))).toEqual(new Percent(3, 100));
    });
    it('different denominators', () => {
      expect(new Percent(1, 25).add(new Percent(2, 100))).toEqual(new Percent(150, 2500));
    });
  });
  describe('#subtract', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).subtract(new Percent(2, 100))).toEqual(new Percent(-1, 100));
    });
    it('different denominators', () => {
      expect(new Percent(1, 25).subtract(new Percent(2, 100))).toEqual(new Percent(50, 2500));
    });
  });
  describe('#multiply', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).multiply(new Percent(2, 100))).toEqual(new Percent(2, 10000));
    });
    it('different denominators', () => {
      expect(new Percent(1, 25).multiply(new Percent(2, 100))).toEqual(new Percent(2, 2500));
    });
  });
  describe('#divide', () => {
    it('returns a percent', () => {
      expect(new Percent(1, 100).divide(new Percent(2, 100))).toEqual(new Percent(100, 200));
    });
    it('different denominators', () => {
      expect(new Percent(1, 25).divide(new Percent(2, 100))).toEqual(new Percent(100, 50));
    });
  });

  describe('#toSignificant', () => {
    it('returns the value scaled by 100', () => {
      expect(new Percent(154, 10_000).toSignificant(3)).toEqual('1.54');
    });
  });
  describe('#toFixed', () => {
    it('returns the value scaled by 100', () => {
      expect(new Percent(154, 10_000).toFixed(2)).toEqual('1.54');
    });
  });

  describe('#parsePercent', () => {
    it('returns valid percent', () => {
      // Percent is a Fraction
      // 100% = 100/100 = 1
      const ONE_HUNDRED = new Fraction(100, 100);
      const FIFTY = new Fraction(50, 100);
      const FIVE = new Fraction(5, 100);
      const HALF = new Fraction(5, 1000);
      expect(parsePercent('100', 2).equalTo(ONE_HUNDRED)).toBeTruthy();
      expect(parsePercent('100', 4).equalTo(ONE_HUNDRED)).toBeTruthy();
      expect(parsePercent('50', 2).equalTo(FIFTY)).toBeTruthy();
      expect(parsePercent('50', 4).equalTo(FIFTY)).toBeTruthy();
      expect(parsePercent('5', 2).equalTo(FIVE)).toBeTruthy();
      expect(parsePercent('5', 4).equalTo(FIVE)).toBeTruthy();
      expect(parsePercent('0.5', 2).equalTo(HALF)).toBeTruthy();
      expect(parsePercent('0.5', 4).equalTo(HALF)).toBeTruthy();
    });

    it('throws when more decimals provided', () => {
      expect(() => {
        parsePercent('0.5', 0);
      }).toThrow();
    });
  });

  describe('#tryParsePercent', () => {
    it('does not throw when more decimals provided', () => {
      let value;
      expect(() => {
        value = tryParsePercent('0.5', 0);
      }).not.toThrow();

      expect(value).toBeUndefined();
    });
  });
});
