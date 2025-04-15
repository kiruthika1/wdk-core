import type {ChainKey} from '@wdk-account-abstraction-ton/ui-core';
import type {BaseProvider} from '@ethersproject/providers';
import {ProxyBaseProvider} from './providers/ProxyBaseProvider';

export interface TestingFork {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export type TestingSdk<T extends TestingFork> = {
  createFork: (input: {chainKey: ChainKey}) => Promise<T>;
};

export type TestingProvider = BaseProvider & {
  startFork(): Promise<unknown>;
  stopFork(): Promise<unknown>;

  setBalance: (address: string, amount: number | bigint) => Promise<void>;
  addBalance: (address: string, amount: number | bigint) => Promise<void>;
  setErc20Balance: (token: string, wallet: string, value: number | bigint) => Promise<void>;
};

export class TestingProxyProvider<TProvider extends TestingProvider>
  extends ProxyBaseProvider<TProvider>
  implements TestingProvider
{
  async startFork() {
    const provider = await this.providerPromise;
    return provider.startFork();
  }

  async stopFork() {
    const provider = await this.providerPromise;
    return provider.stopFork();
  }

  async setBalance(address: string, amount: number | bigint) {
    const provider = await this.providerPromise;
    return provider.setBalance(address, amount);
  }

  async addBalance(address: string, amount: number | bigint) {
    const provider = await this.providerPromise;
    return provider.addBalance(address, amount);
  }

  async setErc20Balance(token: string, wallet: string, value: number | bigint) {
    const provider = await this.providerPromise;
    return provider.setErc20Balance(token, wallet, value);
  }
}
