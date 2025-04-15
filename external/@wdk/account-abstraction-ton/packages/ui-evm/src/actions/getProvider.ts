import {
  type BaseProvider,
  type JsonRpcFetchFunc,
  type Network,
  Web3Provider,
} from '@ethersproject/providers';
import type {ChainKey} from '@wdk-account-abstraction-ton/ui-core';
import type {GetPublicClient} from './getPublicClient';
import {getAddress, type PublicClient} from 'viem';

export type GetProvider<Provider extends BaseProvider = BaseProvider> = (
  chainKey: ChainKey,
) => Provider;

export function createProvider(publicClient: PublicClient) {
  const network = publicClient.chain
    ? {chainId: publicClient.chain.id, name: publicClient.chain.name}
    : undefined;

  const jsonRpcFetchFunc: JsonRpcFetchFunc = async (method, params) => {
    const multicall3 = publicClient.chain?.contracts?.multicall3;
    if (multicall3) {
      if (method === 'eth_getBalance') {
        const [address, blockTag] = params as [string, any];
        const balance = await publicClient.readContract({
          abi: multicall3Abi,
          address: multicall3.address,
          functionName: 'getEthBalance',
          args: [getAddress(address)],
          blockTag,
        });
        return balance;
      }
      if (method === 'eth_call') {
        const [args, blockTag] = params as any;
        const result = await publicClient.call({...args, blockTag});
        return result.data;
      }
    }
    return publicClient.request({method, params} as any);
  };
  const provider = new Web3StaticProvider(jsonRpcFetchFunc, network);
  return provider;
}

export const createGetProvider = ({getPublicClient}: {getPublicClient: GetPublicClient}) => {
  const providers: Record<string, Web3Provider> = {};
  return (chainKey: ChainKey) => {
    if (!providers[chainKey]) {
      const publicClient = getPublicClient(chainKey);
      const provider = createProvider(publicClient);
      providers[chainKey] = provider;
    }
    return providers[chainKey];
  };
};

class Web3StaticProvider extends Web3Provider {
  // using cached network to reduce RPC calls
  async detectNetwork(): Promise<Network> {
    return this.network;
  }
}

const multicall3Abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'getEthBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
