import {
  assert,
  type BalanceProvider,
  type Currency,
  CurrencyAmount,
  isToken,
  isAptosChainKey,
  type ChainKey,
} from '@wdk-account-abstraction-ton/ui-core';
import {isAptosAddress} from '../utils/isAptosAddress';

import {isErrorOfAccountNotFound} from '../utils/errors';
import {AptosResourceProvider} from '../AptosResourceProvider';
import type {GetAptosClientFunction} from '../types/GetAptosClientFunction';

export class BalanceProvider__aptos implements BalanceProvider {
  protected readonly endpointVersion = 1;
  private readonly resourceProviders: Record<ChainKey, AptosResourceProvider> = {};

  constructor(private readonly getAptosClient: GetAptosClientFunction) {}

  supports(token: Currency): boolean {
    return isAptosChainKey(token.chainKey);
  }

  protected getResourceProvider(chainKey: ChainKey): AptosResourceProvider {
    let resourceProvider = this.resourceProviders[chainKey];
    if (resourceProvider === undefined) {
      const aptosClient = this.getAptosClient(chainKey);
      resourceProvider = new AptosResourceProvider(aptosClient);
      this.resourceProviders[chainKey] = resourceProvider;
    }
    return resourceProvider;
  }

  async getBalance(token: Currency, address: string) {
    assert(isAptosAddress(address));
    assert(isAptosChainKey(token.chainKey));
    assert(isToken(token));
    const resourceType = `0x1::coin::CoinStore<${token.address}>`;
    try {
      const resourceProvider = this.getResourceProvider(token.chainKey);
      const resources = await resourceProvider.getAccountResources(address);
      const resource = resources.find((r) => r.type === resourceType);
      if (resource === undefined) {
        return CurrencyAmount.fromRawAmount(token, 0);
      }
      const balance = BigInt((resource.data as any)['coin']['value']);
      return CurrencyAmount.fromRawAmount(token, balance);
    } catch (e) {
      if (isErrorOfAccountNotFound(e)) {
        return CurrencyAmount.fromRawAmount(token, 0);
      }
      throw e;
    }
  }
}
