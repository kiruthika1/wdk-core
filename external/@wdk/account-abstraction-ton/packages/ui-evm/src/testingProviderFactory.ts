import {type ChainKey, assert} from '@wdk-account-abstraction-ton/ui-core';
import type {BaseProvider} from '@ethersproject/providers';
import type {ProviderFactory} from './providerFactory';

export type TestingProviderFactory = ProviderFactory<TestingProvider> & {
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

export type TestingFork = {};

export type TestingProviderSdk<T extends TestingFork> = {
  createFork: (input: {chainKey: ChainKey}) => Promise<T | undefined>;
  deleteFork: (fork: T) => Promise<void>;
};

export type TestingProvider = BaseProvider & {
  setBalance: (address: string, amount: number | bigint) => Promise<void>;
  addBalance: (address: string, amount: number | bigint) => Promise<void>;
  setErc20Balance: (token: string, wallet: string, value: number | bigint) => Promise<void>;
};

interface TestingProviderConstructor<T> {
  new (...args: any[]): T;
}

export const createTestingProviderFactory = <T1 extends TestingProvider, T2 extends TestingFork>(
  sdk: TestingProviderSdk<T2>,
  chainKeys: ChainKey[],
  supportedChains: ChainKey[],
  type: TestingProviderConstructor<T1>,
): TestingProviderFactory => {
  for (const chainKey of chainKeys) {
    if (supportedChains.length > 0 && !supportedChains.includes(chainKey)) {
      throw new Error(`Unsupported chain: ${chainKey}`);
    }
  }

  let started = false;
  let stopped = false;
  const forks: Map<ChainKey, T2> = new Map();
  const providers: Map<ChainKey, T1> = new Map();

  const stop = async () => {
    stopped = true;
    for (const [chainId, fork] of forks) {
      await sdk.deleteFork(fork);

      forks.delete(chainId);
    }
  };

  const factory = (chainKey: ChainKey) => {
    assert(started, 'Provider factory not started');
    assert(!stopped, 'Provider factory stopped');

    const existingProvider = providers.get(chainKey);
    if (existingProvider) {
      return existingProvider;
    }

    const fork = forks.get(chainKey);
    assert(fork, `No forks available for ${chainKey}`);
    const createdProvider = new type(fork);
    providers.set(chainKey, createdProvider);
    return createdProvider;
  };

  const start = async () => {
    try {
      for (const chainKey of chainKeys) {
        const fork = await sdk.createFork({chainKey});
        if (fork) {
          forks.set(chainKey, fork);
        }
      }
      started = true;
    } catch (error) {
      await stop();

      throw error;
    }
  };

  const testingProviderFactory: TestingProviderFactory = Object.assign(factory, {
    start,
    stop,
  });

  return testingProviderFactory;
};
