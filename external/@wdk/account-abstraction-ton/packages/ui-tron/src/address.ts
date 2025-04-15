import {isTronAddress, InvalidAddressError} from '@wdk-account-abstraction-ton/ui-core';
import {base58} from '@scure/base';
import {bytesToHex, getAddress} from 'viem';

type HexString = `0x${string}`;

export function toHexAddress(address: string): HexString {
  // isTronAddress handles checksum validation
  if (!isTronAddress(address)) {
    throw new InvalidAddressError({address, type: 'tron'});
  }
  if (address.startsWith('T')) {
    const decoded = base58.decode(address);
    return bytesToHex(decoded.slice(1, 21));
  }
  if (address.startsWith('0x')) {
    return getAddress(address);
  }
  throw new InvalidAddressError({address, type: 'tron'});
}
