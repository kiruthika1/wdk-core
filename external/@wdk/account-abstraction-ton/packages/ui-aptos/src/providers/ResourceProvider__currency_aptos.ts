import {
  type Currency,
  isAptosChainKey,
  isCurrency,
  isToken,
  type ResourceProvider,
  type Transaction,
} from '@wdk-account-abstraction-ton/ui-core';
import type {AptosManagedCoinRegisterService} from '../AptosManagedCoinRegisterService';
import type {AptosSigner} from '../types/AptosSigner';

export class ResourceProvider__currency_aptos implements ResourceProvider<AptosSigner, Currency> {
  constructor(private readonly service: AptosManagedCoinRegisterService) {}

  supports(resource: unknown): resource is Currency {
    if (!isCurrency(resource)) return false;
    return isAptosChainKey(resource.chainKey);
  }

  register(resource: Currency): Promise<Transaction<AptosSigner>> {
    return this.service.registerCoin(resource);
  }

  async isRegistered(resource: Currency, address: string): Promise<boolean> {
    return this.service.isRegistered(resource, address);
  }

  getType(resource: Currency): string {
    return `${resource.chainKey}:${isToken(resource) ? resource.address : '0x'}`;
  }
}
