import type {ChainKey} from '@wdk-account-abstraction-ton/ui-core';
import {type PublicClient, type Chain, createPublicClient, http} from 'viem';

export type GetPublicClient = (chainKey: ChainKey) => PublicClient;

export const createGetPublicClient = <config extends {chains: Record<ChainKey, Chain>}>({
  config,
  createClient = defaultCreateClient,
}: {config: config; createClient?: (chain: Chain) => PublicClient}) => {
  const clients: Record<string, PublicClient> = {};

  function getChain(chainKey: ChainKey) {
    const chain = config.chains[chainKey];
    if (chain) return chain;
    throw new Error(`Chain ${chainKey} not found`);
  }

  const getPublicClient: GetPublicClient = (chainKey: ChainKey) => {
    if (!clients[chainKey]) {
      const chain = getChain(chainKey);
      clients[chainKey] = createClient(chain);
    }
    return clients[chainKey];
  };

  return getPublicClient;
};

function defaultCreateClient(chain: Chain): PublicClient {
  return createPublicClient({
    batch: {
      multicall: true,
    },
    chain,
    transport: http(),
  });
}
