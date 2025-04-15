import {ethers, utils} from 'ethers';
import {isSolanaAddress} from '@wdk-account-abstraction-ton/ui-core';

export function hexZeroPadTo32(addr: string): string {
  return ethers.utils.hexZeroPad(addr, 32);
}

export function trim0x(str: string): string {
  return str.replace(/^0x/, '');
}

/**
 * Convert address to bytes32
 * @param address 0x prefixed address(20bytes or 32bytes) or solana address
 */
export function addressToBytes32(address: string): Uint8Array {
  if (isSolanaAddress(address)) {
    return utils.base58.decode(address);
  } else if (address.startsWith('0x') && address.length <= 66) {
    return utils.arrayify(hexZeroPadTo32(address));
  }
  throw new Error('Invalid address');
}
