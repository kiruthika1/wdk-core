import {type Accounts, isErrorOfApiError} from '@wdk-account-abstraction-ton/ui-aptos';
import {assert, hasAddress, type ChainKey} from '@wdk-account-abstraction-ton/ui-core';
import type {BCS, Types, MaybeHexString, AptosClient} from 'aptos';
import type {AccountsConfig} from './types';
import {getDeployment} from '../utils';
import type {OftBridgeConfig} from '../types';

export function sendCoinPayload(
  accounts: Accounts,
  oftType: string,
  dstChainId: BCS.Uint16,
  dstReceiver: BCS.Bytes,
  amount: BCS.Uint64 | BCS.Uint32,
  minAmount: BCS.Uint64 | BCS.Uint32,
  nativeFee: BCS.Uint64 | BCS.Uint32,
  zroFee: BCS.Uint64 | BCS.Uint32,
  adapterParams: BCS.Bytes,
  msgLibParams: BCS.Bytes,
): Types.EntryFunctionPayload {
  const module = `${accounts.layerzero_apps.address}::oft`;
  return {
    function: `${module}::send`,
    type_arguments: [oftType],
    arguments: [
      dstChainId.toString(),
      dstReceiver,
      amount.toString(),
      minAmount.toString(),
      nativeFee.toString(),
      zroFee.toString(),
      adapterParams,
      msgLibParams,
    ],
  };
}

export function getTypeAddress(oftAddress: string): string {
  const match = oftAddress.match(/0x(?<address>.*)::(?<module>.*)::(?<struct>.*)/i);
  if (!match) {
    throw new Error(`Invalid oft type: ${oftAddress}`);
  }
  const {address} = match.groups!;
  return address;
}

export function getAccount(
  accounts: AccountsConfig,
  chainKey: ChainKey,
  app: keyof AccountsConfig[ChainKey],
): MaybeHexString {
  const address = accounts[chainKey]?.[app]?.address;
  if (address) return address;
  throw new Error(`No address for ${app} on ${chainKey}`);
}

export function claimCoinPayload(accounts: Accounts, oftType: string) {
  const module = `${accounts.layerzero_apps.address}::oft`;
  return {
    function: `${module}::claim`,
    type_arguments: [oftType],
    arguments: [],
  };
}

export async function getCoinStore(
  accounts: Accounts,
  client: AptosClient,
  oftType: string,
): Promise<Types.MoveResource> {
  const module = `${accounts.layerzero_apps.address}::oft`;
  const address = getTypeAddress(oftType);
  return client.getAccountResource(address, `${module}::CoinStore<${oftType}>`);
}

export async function getUnclaimed(
  accounts: Accounts,
  client: AptosClient,
  oftType: string,
  owner: string,
): Promise<BCS.Uint64> {
  const resource = await getCoinStore(accounts, client, oftType);
  const {claimable_amount} = resource.data as {claimable_amount: {handle: string}};
  const claimableAmtLDHandle = claimable_amount.handle;

  try {
    const response = await client.getTableItem(claimableAmtLDHandle, {
      key_type: 'address',
      value_type: 'u64',
      key: owner,
    });
    return BigInt(response);
  } catch (e) {
    if (isErrorOfApiError(e, 404)) {
      return 0n;
    }
    throw e;
  }
}

export function getOftAddress(chainKey: ChainKey, config: OftBridgeConfig): string {
  const deployment = getDeployment(chainKey, config);
  const token = deployment.token;
  assert(hasAddress(token), 'Token address is required');
  return token.address;
}
