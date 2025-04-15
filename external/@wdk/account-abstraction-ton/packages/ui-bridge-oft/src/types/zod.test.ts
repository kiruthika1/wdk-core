import {describe, it, expect} from 'vitest';
import {type SerializedOftBridgeConfig, createOftBridgeConfig, oftBridgeConfigSchema} from './zod';
import {Token, Coin} from '@wdk-account-abstraction-ton/ui-core';

// todo provide more test cases when schema fails
describe('zod', () => {
  it('parses schema', () => {
    const input: SerializedOftBridgeConfig = {
      version: 2,
      fee: true,
      sharedDecimals: 18,
      deployments: {
        metis: {
          eid: 151,
          oftNative: {
            address: '0xe110af9bc0c40beaa8b797c5b45d8b4299bd5ab7',
          },
          token: {
            chainKey: 'metis',
            symbol: 'Metis',
            decimals: 18,
          },
        },
        bsc: {
          eid: 102,
          token: {
            address: '0xE110AF9Bc0C40bEAA8b797c5B45D8b4299BD5ab7',
            chainKey: 'bsc',
            decimals: 18,
            symbol: 'Metis',
            name: 'Metis',
          },
        },
      },
    };
    const config = oftBridgeConfigSchema.parse(input);
    expect(config.deployments.metis.token).toBeInstanceOf(Coin);
    expect(config.deployments.bsc.token).toBeInstanceOf(Token);
  });

  it('parses schema with proxy', () => {
    const V2 = createOftBridgeConfig({
      fee: false,
      version: 2,
      sharedDecimals: 8,
      deployments: {
        ethereum: {
          eid: 101,
          oftProxy: {
            address: '0x439a5f0f5E8d149DDA9a0Ca367D4a8e4D6f83C10',
          },
          token: {
            chainKey: 'ethereum',
            address: '0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3',
            decimals: 18,
            symbol: 'OFT',
          },
        },
        bsc: {
          eid: 102,
          oftProxy: {
            address: '0x41d5a04b4e03dc27dc1f5c5a576ad2187bc601af',
          },
          token: {
            chainKey: 'bsc',
            address: '0xfE19F0B51438fd612f6FD59C1dbB3eA319f433Ba',
            decimals: 18,
            symbol: 'OFT',
          },
        },
      },
    });

    expect(V2.deployments.ethereum.oftProxy).toBeDefined();
    expect(V2.deployments.bsc.oftProxy).toBeDefined();
  });
});
