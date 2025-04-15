import {Coin} from './coin';
import {Token} from './token';
import {describe, it, expect} from 'vitest';

describe('Currency', () => {
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

  const t0 = new Token(1, ADDRESS_ZERO, 18, 'TEST');
  const t1 = new Token(1, ADDRESS_ONE, 18, 'TEST');

  describe('#equals', () => {
    it('token1 is not token0', () => {
      expect(t1.equals(t0)).toStrictEqual(false);
    });
    it('token0 is token0', () => {
      expect(t0.equals(t0)).toStrictEqual(true);
    });
    it('token0 is equal to another token0', () => {
      expect(t0.equals(new Token(1, ADDRESS_ZERO, 18, 'symbol', 'name'))).toStrictEqual(true);
    });
  });

  describe('JSON.stringify', () => {
    it('does not serialize Token.id', () => {
      const token = Token.from({
        chainKey: 'ethereum',
        address: ADDRESS_ZERO,
        decimals: 18,
        symbol: 'TEST',
        name: 'TEST',
      });
      const serialized = JSON.parse(JSON.stringify(token));
      expect(serialized).not.toHaveProperty('id');
    });
    it('does not serialize Coin.id', () => {
      const coin = Coin.from({chainKey: 'ethereum', decimals: 18, symbol: 'ETH', name: 'ETH'});
      const serialized = JSON.parse(JSON.stringify(coin));
      expect(serialized).not.toHaveProperty('id');
    });
  });
});
