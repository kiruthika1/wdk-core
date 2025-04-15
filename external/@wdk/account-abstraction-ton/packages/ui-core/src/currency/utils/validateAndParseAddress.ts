import {getAddress as getEvmAddress, isAddress as isEvmAddress} from 'viem';

export function validateAndParseAddress(address: string, chainKey: string): string {
  if (address === '') {
    throw new Error('No address provided');
  }
  if (isEvmAddress(address)) {
    return getEvmAddress(address);
  }
  return address;
}
