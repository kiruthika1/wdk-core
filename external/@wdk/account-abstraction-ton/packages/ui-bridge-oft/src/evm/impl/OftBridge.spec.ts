import {createFailoverProviderFactory} from '@wdk-account-abstraction-ton/ui-evm';
import {describe, test, expect} from 'vitest';
import {OftBridgeApiFactory__evm} from '../OftBridgeApiFactory__evm';
import {AdapterParams, CurrencyAmount, getNativeCurrency} from '@wdk-account-abstraction-ton/ui-core';
import {createOftBridgeConfig} from '../../types';
import {getDeployment} from '../../utils';

const V0 = createOftBridgeConfig({
  version: 0,
  fee: false,
  sharedDecimals: 18,
  deployments: {
    ethereum: {
      eid: 101,
      token: {
        chainKey: 'ethereum',
        decimals: 18,
        symbol: 'OFT',
        address: '0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6',
      },
    },
    bsc: {
      eid: 102,
      token: {
        chainKey: 'bsc',
        decimals: 18,
        symbol: 'OFT',
        address: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',
      },
    },
  },
});

const V1 = createOftBridgeConfig({
  version: 1,
  fee: false,
  sharedDecimals: 6,
  deployments: {
    ethereum: {
      eid: 101,
      token: {
        chainKey: 'ethereum',
        address: '0x9ed7E4B1BFF939ad473dA5E7a218C771D1569456',
        decimals: 6,
        symbol: 'OFT',
      },
    },
    bsc: {
      eid: 102,
      token: {
        chainKey: 'bsc',
        address: '0x9ed7E4B1BFF939ad473dA5E7a218C771D1569456',
        decimals: 6,
        symbol: 'OFT',
      },
    },
  },
});

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

const V2Fee = createOftBridgeConfig({
  version: 2,
  fee: true,
  sharedDecimals: 8,
  deployments: {
    ethereum: {
      eid: 101,
      token: {
        chainKey: 'ethereum',
        address: '0x2297aEbD383787A160DD0d9F71508148769342E3',
        decimals: 8,
        symbol: 'OFT',
      },
    },
    bsc: {
      eid: 102,
      token: {
        chainKey: 'bsc',
        address: '0x2297aEbD383787A160DD0d9F71508148769342E3',
        decimals: 8,
        symbol: 'OFT',
      },
    },
  },
});

const V2Native = createOftBridgeConfig({
  fee: true,
  sharedDecimals: 18,
  version: 2,
  deployments: {
    metis: {
      eid: 151,
      oftNative: {
        address: '0xceCB301c2e2A04dD631428C386DD21db70716F8a',
      },
      token: getNativeCurrency('metis'),
    },
    bsc: {
      eid: 102,
      token: {
        address: '0xceCB301c2e2A04dD631428C386DD21db70716F8a',
        chainKey: 'bsc',
        decimals: 18,
        symbol: 'METIS',
        name: 'Metis',
      },
    },
  },
});

const V3 = createOftBridgeConfig({
  deployments: {
    avalanche: {
      eid: 30106,
      token: {
        chainKey: 'avalanche',
        symbol: 'OP',
        address: '0xaC800FD6159c2a2CB8fC31EF74621eB430287a5A',
        decimals: 18,
      },
    },
    arbitrum: {
      eid: 30110,
      token: {
        chainKey: 'arbitrum',
        symbol: 'OP',
        address: '0xaC800FD6159c2a2CB8fC31EF74621eB430287a5A',
        decimals: 18,
      },
    },
    optimism: {
      eid: 30111,
      oftProxy: {
        address: '0xaC800FD6159c2a2CB8fC31EF74621eB430287a5A',
      },
      token: {
        chainKey: 'optimism',
        symbol: 'OP',
        address: '0x4200000000000000000000000000000000000042',
        decimals: 18,
      },
    },
  },
  sharedDecimals: 6,
  version: 3,
  fee: false,
});

const providerFactory = createFailoverProviderFactory();
const apiFactory = new OftBridgeApiFactory__evm(providerFactory);

describe('OFT APIs', () => {
  test.each([
    {srcChainKey: 'ethereum', dstChainKey: 'bsc', config: V0, version: 'V0'},
    {srcChainKey: 'ethereum', dstChainKey: 'bsc', config: V1, version: 'V1'},
    {srcChainKey: 'ethereum', dstChainKey: 'bsc', config: V2, version: 'V2'},
    {srcChainKey: 'ethereum', dstChainKey: 'bsc', config: V2Fee, version: 'V2 with fee'},
    {srcChainKey: 'metis', dstChainKey: 'bsc', config: V2Native, version: 'Native V2 with fee'},
    {srcChainKey: 'arbitrum', dstChainKey: 'optimism', config: V3, version: 'V3'},
  ])('OFT Bridge $version', async ({config, srcChainKey, dstChainKey}) => {
    const api = apiFactory.create(config);
    const srcAddress = '0x6d9798053f498451BEC79c0397F7f95B079BDCd6'; // sender
    const dstAddress = '0x6d9798053f498451BEC79c0397F7f95B079BDCd6'; // receiver=
    const srcToken = getDeployment(srcChainKey, config).token;
    const dstToken = getDeployment(dstChainKey, config).token;
    const dstNative = getNativeCurrency(dstChainKey);
    const dstNativeAddress = dstAddress;
    const dstNativeAmount = CurrencyAmount.fromRawAmount(dstNative, 1);
    const extraGas = await api.getExtraGas({srcToken, dstToken});
    expect(extraGas).toBeTypeOf('number');
    const adapterParams = AdapterParams.forV2({
      extraGas,
      dstNativeAmount,
      dstNativeAddress,
    });
    const msgFee = await api.getMessageFee({
      srcToken,
      dstToken,
      adapterParams,
    });

    const srcAmount = CurrencyAmount.fromRawAmount(srcToken, 1e10);
    const dstAmountMin = CurrencyAmount.fromRawAmount(dstToken, 0);
    const output = await api.getOutput({srcAmount, dstToken});
    const unsignedTx = await api.transfer({
      mode: 'taxi',
      adapterParams,
      srcAddress,
      dstAddress,
      srcToken,
      dstToken,
      srcAmount,
      dstAmountMin,
      srcChainKey,
      dstChainKey,
      fee: msgFee,
      dstNativeAmount,
    });
    expect(msgFee).toBeDefined();
    expect(output).toBeDefined();
    expect(unsignedTx).toBeDefined();
  });
});
