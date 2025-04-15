import {describe, test, expect} from 'vitest';
import {
  assert,
  AdapterParams,
  getNativeCurrency,
  parseCurrencyAmount,
} from '@wdk-account-abstraction-ton/ui-core';
import {createFailoverProviderFactory, createMulticallProviderFactory} from '@wdk-account-abstraction-ton/ui-evm';
import {OftBridgeV2Fee} from './OftBridgeV2Fee';
import {type OftBridgeConfig, createOftBridgeConfig} from '../../types';

const config: OftBridgeConfig = createOftBridgeConfig({
  fee: true,
  sharedDecimals: 18,
  version: 2 as const,
  deployments: {
    metis: {
      eid: 151,
      oftNative: {
        address: '0xe110af9bc0c40beaa8b797c5b45d8b4299bd5ab7',
      },
      token: getNativeCurrency('metis'),
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
});

// TODO: run integration tests in separate workflow
describe.skip('OFTV2Fee', () => {
  const multicall = createMulticallProviderFactory(createFailoverProviderFactory());
  const api = new OftBridgeV2Fee(multicall, config);
  // fails because : insufficient balance for transfer
  test.fails(
    'send native',
    async () => {
      // this is an integration test
      // will perform RPC calls to actual contract
      const src = config.deployments.metis;
      const dst = config.deployments.bsc;
      const srcChainKey = src.token.chainKey;
      const dstChainKey = dst.token.chainKey;

      const srcToken = src.token;
      const dstToken = dst.token;

      const srcAmount = parseCurrencyAmount(srcToken, '1');
      const dstAmountMin = parseCurrencyAmount(dstToken, '0');
      const adapterParams = AdapterParams.forV1(300_000);

      const srcAddress = '0x6d9798053f498451BEC79c0397F7f95B079BDCd6';

      const fee = await api.getMessageFee({
        srcToken,
        dstToken,
        adapterParams,
      });

      const unsignedTx = await api.transfer({
        mode: 'taxi',
        srcChainKey,
        dstChainKey,
        srcToken,
        dstToken,
        srcAmount,
        dstAmountMin,
        adapterParams,
        srcAddress,
        dstAddress: srcAddress,
        fee,
      });

      const nativeGas = await unsignedTx.estimateNative();
      expect(nativeGas).toBeDefined();
    },
    {timeout: 10_000},
  );

  test.fails(
    'send token',
    async () => {
      // this is an integration test
      // will perform RPC calls to actual contract

      const srcChainKey = 'bsc';
      const dstChainKey = 'metis';

      const srcToken = config.deployments[srcChainKey].token;
      const dstToken = getNativeCurrency(dstChainKey);
      assert(srcToken);
      const srcAmount = parseCurrencyAmount(srcToken, '1');
      const dstAmountMin = srcAmount.multiply(0);
      const adapterParams = AdapterParams.forV1(300_000);

      // using token address - otherwise test will fail because of insufficient balance
      const srcAddress = '0xE110AF9Bc0C40bEAA8b797c5B45D8b4299BD5ab7';

      const fee = await api.getMessageFee({
        srcToken,
        dstToken,
        adapterParams,
      });

      const unsignedTx = await api.transfer({
        mode: 'taxi',
        srcChainKey,
        dstChainKey,
        srcToken,
        dstToken,
        srcAmount,
        dstAmountMin,
        adapterParams,
        srcAddress,
        dstAddress: srcAddress,
        fee,
      });

      const nativeGas = await unsignedTx.estimateNative();
      expect(nativeGas).toBeDefined();
    },
    {timeout: 10_000},
  );
});
