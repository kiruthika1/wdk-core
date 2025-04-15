import {Token} from './token';
import {describe, it, expect} from 'vitest';

describe('Token', () => {
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';
  const ADDRESS_TWO = '0x0000000000000000000000000000000000000002';

  describe('#constructor', () => {
    it.skip('fails with invalid address', () => {
      expect(
        () => createToken(3, '0xhello00000000000000000000000000000000002', 18, 'TEST').address,
      ).toThrow('0xhello00000000000000000000000000000000002 is not a valid address');
    });
    it('fails with negative decimals', () => {
      expect(() => createToken(3, ADDRESS_ONE, -1, 'TEST').address).toThrow('DECIMALS');
    });
    it('fails with 256 decimals', () => {
      expect(() => createToken(3, ADDRESS_ONE, 256, 'TEST').address).toThrow('DECIMALS');
    });
    it('fails with non-integer decimals', () => {
      expect(() => createToken(3, ADDRESS_ONE, 1.5, 'TEST').address).toThrow('DECIMALS');
    });
  });

  describe('#equals', () => {
    it('fails if address differs', () => {
      expect(
        createToken(1, ADDRESS_ONE, 18, 'TEST').equals(createToken(1, ADDRESS_TWO, 18, 'TEST')),
      ).toBe(false);
    });

    it('false if chain id differs', () => {
      expect(
        createToken(3, ADDRESS_ONE, 18, 'TEST').equals(createToken(1, ADDRESS_ONE, 18, 'TEST')),
      ).toBe(false);
    });

    it('true if only decimals differs', () => {
      expect(
        createToken(1, ADDRESS_ONE, 9, 'TEST').equals(createToken(1, ADDRESS_ONE, 18, 'TEST')),
      ).toBe(true);
    });

    it('true if address is the same', () => {
      expect(
        createToken(1, ADDRESS_ONE, 18, 'TEST').equals(createToken(1, ADDRESS_ONE, 18, 'TEST')),
      ).toBe(true);
    });

    it('true on reference equality', () => {
      const token = createToken(1, ADDRESS_ONE, 18, 'TEST');
      expect(token.equals(token)).toBe(true);
    });

    it('true even if name/symbol/decimals differ', () => {
      const tokenA = createToken(1, ADDRESS_ONE, 9, 'abc', 'def');
      const tokenB = createToken(1, ADDRESS_ONE, 18, 'ghi', 'jkl');
      expect(tokenA.equals(tokenB)).toBe(true);
    });
  });
});

// util to make test backwards compatible
function createToken(
  chainId: number,
  address: string,
  decimals: number,
  symbol: string,
  name?: string,
): Token {
  return Token.from({chainKey: String(chainId), address, decimals, symbol, name});
}
