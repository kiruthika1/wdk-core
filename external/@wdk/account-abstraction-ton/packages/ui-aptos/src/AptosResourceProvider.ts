import {assert} from '@wdk-account-abstraction-ton/ui-core';
import {isAptosAddress} from './utils/isAptosAddress';
import type {AptosClient} from 'aptos';

import {isErrorOfAccountNotFound} from './utils/errors';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

export class AptosResourceProvider {
  readonly getAccountResources: AptosClient['getAccountResources'];

  constructor(
    private readonly aptosClient: AptosClient,
    cacheMs = 1000,
  ) {
    // tsup complains about private readonly properties not being initialized
    // if we create this using readonly method assignment
    this.getAccountResources = pMemoize(
      async (address: string) => {
        try {
          assert(isAptosAddress(address));
          const resources = await this.aptosClient.getAccountResources(address);
          return resources;
        } catch (e) {
          if (isErrorOfAccountNotFound(e)) return [];
          throw e;
        }
      },
      {cacheKey: ([address]) => address, cache: new ExpiryMap(cacheMs)},
    );
  }
}
