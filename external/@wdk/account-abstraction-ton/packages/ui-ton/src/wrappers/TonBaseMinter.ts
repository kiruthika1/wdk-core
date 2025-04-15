import {Address, Contract, ContractProvider} from '@ton/core';

export abstract class TonBaseMinter implements Contract {
  constructor(readonly address: Address) {}

  abstract getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address>;
}
