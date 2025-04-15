import {test, expect} from 'vitest';
import {convertFromV1} from './convertFromV1';

test('convertFromV1', () => {
  const oldConfig = {
    fee: true,
    sharedDecimals: 6,
    version: 3,
    tokens: [
      {
        address: '0xC227717ef4Ae4D982E14789eB33bA942243c3FEe',
        chainId: 184,
        decimals: 18,
        symbol: 'MOZ',
        name: 'Mozaic Token',
      },
      {
        address: '0x20547341E58fB558637FA15379C92e11F7b7F710',
        chainId: 110,
        decimals: 18,
        symbol: 'MOZ',
        name: 'Mozaic Token',
      },
    ],
    proxy: [{chainId: 110, address: '0x80cf6a0dcfe90a2c8f89b842a7f71da78fe92c6e'}],
  };

  const newConfig = convertFromV1(oldConfig, 2);
  console.log(newConfig);

  expect(newConfig).toBeDefined();
});
