import {ChainType} from '../types/ChainType';

export class InvalidAddressError extends Error {
  public readonly name = 'InvalidAddressError';
  constructor({address, type}: {address: string; type: ChainType}) {
    super(`Invalid address: ${address} for chain type: ${type}`);
  }
}
