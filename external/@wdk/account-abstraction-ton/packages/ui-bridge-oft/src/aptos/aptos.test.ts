import type {GetAptosClientFunction} from '@wdk-account-abstraction-ton/ui-aptos';
import {createOftBridgeConfig} from '../types';
import {OftBridgeV2__aptos} from './OftBridgeV2__aptos';
import {test, expect} from 'vitest';
import {AptosClient} from 'aptos';
import {assert, getNativeCurrency, parseCurrencyAmount} from '@wdk-account-abstraction-ton/ui-core';
import {AddressOne} from '@wdk-account-abstraction-ton/ui-evm';
import {getDeployment} from '../utils';
import {OftClaimV2__aptos} from './OftClaimV2__aptos';

const client = new AptosClient('https://mainnet.aptoslabs.com/v1');

const getClient: GetAptosClientFunction = (chainKey) => {
  assert(chainKey === 'aptos');
  return client;
};

const accounts = {
  aptos: {
    layerzero: {
      address: '0x54ad3d30af77b60d939ae356e6606de9a4da67583f02b962d2d3f2e481484e90',
    },
    layerzero_apps: {
      address: '0x43d8cad89263e6936921a0adb8d5d49f0e236c229460f01b14dca073114df2b9',
    },
    executor: {
      address: '0x1d8727df513fa2a8785d0834e40b34223daff1affc079574082baadb74b66ee4',
      version: '1',
    },
  },
} as const;

const oftConfig = createOftBridgeConfig({
  deployments: {
    bsc: {
      eid: 102,
      oftProxy: {
        address: '0xb274202daBA6AE180c665B4fbE59857b7c3a8091',
      },
      token: {
        chainKey: 'bsc',
        symbol: 'Cake',
        address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        decimals: 18,
      },
    },
    ethereum: {
      eid: 101,
      token: {
        chainKey: 'ethereum',
        symbol: 'Cake',
        address: '0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898',
        decimals: 18,
      },
    },
    arbitrum: {
      eid: 110,
      token: {
        chainKey: 'arbitrum',
        symbol: 'Cake',
        address: '0x1b896893dfc86bb67Cf57767298b9073D2c1bA2c',
        decimals: 18,
      },
    },
    zkevm: {
      eid: 158,
      token: {
        chainKey: 'zkevm',
        symbol: 'Cake',
        address: '0x0D1E753a25eBda689453309112904807625bEFBe',
        decimals: 18,
      },
    },
    aptos: {
      eid: 108,
      token: {
        chainKey: 'aptos',
        symbol: 'Cake',
        address: '0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT',
        decimals: 18,
      },
    },
  },
  sharedDecimals: 8,
  version: 2,
  fee: true,
});

const oftBridge = new OftBridgeV2__aptos(oftConfig, accounts, getClient);

test('getMinDstGas', async () => {
  const minDstGas = await oftBridge.getMinDstGas({
    srcChainKey: 'aptos',
    dstChainKey: 'bsc',
  });
  expect(minDstGas).toBeGreaterThan(0);
});

test('getGlobalStore', async () => {
  const globalStore = await oftBridge.getGlobalStore('aptos');
  expect(globalStore).toBeDefined();
});

test('getFeeBp', async () => {
  const feeBp = await oftBridge.getFeeBp({
    srcChainKey: 'aptos',
    dstChainKey: 'bsc',
  });
  expect(feeBp).toBeTypeOf('bigint');
});

test('getMessageFee', async () => {
  const messageFee = await oftBridge.getMessageFee(
    {
      srcChainKey: 'aptos',
      dstChainKey: 'bsc',
    },
    {
      dstNativeAddress: AddressOne,
      dstNativeAmount: 0n,
      minDstGas: 150_000n,
    },
  );
  expect(messageFee.nativeFee.quotient).toBeGreaterThan(0);
});

test('getRoute', async () => {
  const srcToken = getDeployment('aptos', oftConfig).token;
  const dstToken = getDeployment('bsc', oftConfig).token;
  const srcAmount = parseCurrencyAmount(srcToken, '1');
  const dstAmountMin = parseCurrencyAmount(dstToken, '0');
  const dstNative = getNativeCurrency('bsc');
  const dstNativeAmount = parseCurrencyAmount(dstNative, '0');
  const route = await oftBridge.getRoute({
    srcAddress: '',
    dstAddress: '',
    srcAmount,
    srcToken,
    dstToken,
    dstAmountMin,
    dstNativeAmount,
    mode: 'taxi',
  });
  expect(route).toBeDefined();
});

test('getUnclaimed', async () => {
  const claimApi = new OftClaimV2__aptos(oftConfig, accounts, getClient);
  const token = getDeployment('aptos', oftConfig).token;
  const owner = '0x01125792bd7468489b118ef0d7b14163bd43f53bfe8d9512437cf90bfe270aa9';
  const unclaimed = await claimApi.getUnclaimed({token, owner});
  expect(unclaimed.quotient).toBe(0n);
});
