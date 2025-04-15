import type {ChainKey} from '@wdk-account-abstraction-ton/ui-core';
import type {AptosClient} from 'aptos';

export type GetAptosClientFunction = (chainKey: ChainKey) => AptosClient;
