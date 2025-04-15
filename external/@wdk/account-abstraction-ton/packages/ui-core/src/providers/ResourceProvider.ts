import type {Transaction} from '../types/Transaction';

export type AbstractResource = {
  chainKey: string;
};

export type ResourceProvider<
  Signer = unknown,
  Resource extends AbstractResource = AbstractResource,
> = {
  supports(resource: unknown): resource is Resource;
  register(resource: Resource): Promise<Transaction<Signer>>;
  isRegistered(resource: Resource, address: string): Promise<boolean>;
  getType(resource: Resource): string;
};
