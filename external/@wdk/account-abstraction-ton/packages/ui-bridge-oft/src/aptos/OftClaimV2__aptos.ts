import {createTransaction, type GetAptosClientFunction} from '@wdk-account-abstraction-ton/ui-aptos';
import type {
  ClaimApi,
  ClaimInput,
  GetUnclaimedInput,
  GetUnclaimedResult,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/dist/v2';
import type {OftBridgeConfig} from '../types';
import type {AccountsConfig} from './types';
import {
  type Currency,
  CurrencyAmount,
  isAptosChainKey,
  type Transaction,
} from '@wdk-account-abstraction-ton/ui-core';
import {claimCoinPayload, getOftAddress, getUnclaimed} from './utils';

export class OftClaimV2__aptos implements ClaimApi<unknown> {
  constructor(
    protected config: OftBridgeConfig,
    protected accounts: AccountsConfig,
    protected getClient: GetAptosClientFunction,
  ) {}

  supports(token: Currency): boolean {
    if (!isAptosChainKey(token.chainKey)) return false;
    for (const deployment of Object.values(this.config.deployments)) {
      if (deployment.token.equals(token)) return true;
    }
    return false;
  }

  async claim(input: ClaimInput): Promise<Transaction<unknown>> {
    const client = this.getClient(input.token.chainKey);
    const oftType = getOftAddress(input.token.chainKey, this.config);
    const accounts = this.accounts[input.token.chainKey];
    const entryFunctionPayload = claimCoinPayload(accounts, oftType);
    return createTransaction(entryFunctionPayload, {client});
  }

  async getUnclaimed(input: GetUnclaimedInput): Promise<GetUnclaimedResult> {
    const accounts = this.accounts[input.token.chainKey];
    const client = this.getClient(input.token.chainKey);
    const oftType = getOftAddress(input.token.chainKey, this.config);
    const unclaimed = await getUnclaimed(accounts, client, oftType, input.owner);
    return CurrencyAmount.fromBigInt(input.token, unclaimed);
  }
}
