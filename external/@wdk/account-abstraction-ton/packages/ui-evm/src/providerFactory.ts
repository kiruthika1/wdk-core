import {
  type RpcList,
  type RpcMap,
  createRpcMap,
  getNetwork,
  type ChainKey,
  type Rpc,
} from '@wdk-account-abstraction-ton/ui-core';
import {providers} from '@0xsequence/multicall';
import type {BaseProvider} from '@ethersproject/providers';
import memoize from 'micro-memoize';

import {StaticJsonRpcBatchProvider} from './providers/StaticJsonBatchProvider';
import {FailoverProvider} from './providers/FailoverProvider';
import {randomizeOrder} from './randomize';
import type {ConnectionInfo} from 'ethers/lib/utils';

export type ProviderFactory<T extends BaseProvider = BaseProvider> = (chainKey: ChainKey) => T;

const noop = () => {};

/**
 * Wraps a ProviderFactory in a multicall provider,
 * batching RPC requests instead of sending them one by one
 *
 * @param factory ProviderFactory to be used to fire the batched requests
 *
 * @returns
 */
export const createMulticallProviderFactory = (
  factory: ProviderFactory,
  multicall?: ConstructorParameters<typeof providers.MulticallProvider>[1],
): ProviderFactory<providers.MulticallProvider> =>
  memoize(
    (chainKey) => {
      // by default MulticallProvider ensures multicall contract is deployed at `0xd130B43062D875a4B7aF3f8fc036Bc6e9D3E1B3E`
      // if the chain is not supported - it will forward calls to underlying provider
      if (!multicall) {
        // todo: fix typings
        // @ts-ignore
        const contract = multicallDeployments[chainKey];
        if (contract) multicall = {contract: contract};
      }
      return new providers.MulticallProvider(factory(chainKey), multicall);
    },
    {maxSize: Number.POSITIVE_INFINITY},
  );

export const createFailoverProviderFactory: (
  rpcMap?: RpcMap,
  options?: FailoverProviderOptions,
) => ProviderFactory<FailoverProvider> = (rpcMap = createRpcMap(), options) => {
  return memoize(
    (chainKey: ChainKey) => {
      const rpcList = rpcMap[chainKey];
      if (!rpcList) throw new Error(`No rpcs for ${chainKey}`);
      return createFailoverProvider(chainKey, rpcList, options);
    },
    {maxSize: Number.POSITIVE_INFINITY},
  );
};

// todo: drop in favor of anvil fallback
type FailoverProviderOptions = {
  onError?: (error: unknown) => void;
  onDebug?: (error: unknown) => void;
  connectionInfo?: (rpc: Rpc, chainKey: ChainKey) => ConnectionInfo;
};

function createFailoverProvider(
  chainKey: string,
  rpcList: RpcList,
  options: FailoverProviderOptions = {},
) {
  const network = getNetwork(chainKey);
  if (!rpcList || rpcList.length === 0) {
    throw new Error(`No rpcs for ${chainKey}`);
  }
  const providers = randomizeOrder(rpcList).map((rpc) => {
    return new StaticJsonRpcBatchProvider(
      options.connectionInfo
        ? options.connectionInfo(rpc, chainKey)
        : {url: rpc.url, timeout: rpc.timeout},
      {
        chainId: Number(network.nativeChainId),
        name: network.name,
      },
    );
  });
  providers.forEach((provider) => {
    provider.onError(options.onError ?? noop);
    provider.on('debug', options.onDebug ?? noop);
  });
  return new FailoverProvider(providers, {
    chainId: Number(network.nativeChainId),
    name: network.name,
  });
}
const _0xSequenceDeployment = '0xd130B43062D875a4B7aF3f8fc036Bc6e9D3E1B3E';

export const multicallDeployments: {[chainKey in ChainKey]?: string} = {
  ethereum: _0xSequenceDeployment,
  goerli: _0xSequenceDeployment,
  sepolia: _0xSequenceDeployment,
  bsc: _0xSequenceDeployment,
  'bsc-testnet': _0xSequenceDeployment,
  polygon: _0xSequenceDeployment,
  mumbai: _0xSequenceDeployment,
  zkevm: _0xSequenceDeployment,
  'zkevm-testnet': _0xSequenceDeployment,
  optimism: _0xSequenceDeployment,
  'optimism-goerli': _0xSequenceDeployment,
  arbitrum: _0xSequenceDeployment,
  'arbitrum-goerli': _0xSequenceDeployment,
  avalanche: _0xSequenceDeployment,
  fuji: _0xSequenceDeployment,
  base: _0xSequenceDeployment,
  'base-goerli': _0xSequenceDeployment,
  nova: _0xSequenceDeployment,

  // layerzero deployments
  scroll: '0xFEe867ed545F26621Dc701e6164e02Ead9c6B081',
  mantle: '0x3617dA335F75164809B540bA31bdf79DE6cB1Ee3',
};
