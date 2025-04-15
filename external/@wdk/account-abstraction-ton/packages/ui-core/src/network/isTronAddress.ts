import {base58} from '@scure/base';
import {bytesToHex, type Hex, sha256} from 'viem';

import {isEvmAddress} from './isEvmAddress';

/**
 * Validates whether a given address is a valid Tron address.
 *
 * Tron address format:
 * - Starts with 'T'.
 * - Followed by 33 base58 characters (excluding 0, O, I, and l).
 *
 * The function also verifies the checksum:
 * - Decoded address is 21 bytes long, first byte is 0x41 (Tron network prefix).
 * - Last 4 bytes of the decoded address are the checksum.
 *
 * EVM compatibility:
 * - If the address starts with '0x', it is validated as an EVM address using `isEvmAddress`.
 *
 * @param {string} address - The address to validate.
 * @returns {boolean} - Returns true if the address is a valid Tron or EVM address, otherwise false.
 */
const tronAddressRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
export function isTronAddress(address: string): boolean {
  if (address.startsWith('0x')) {
    return isEvmAddress(address);
  }
  if (!tronAddressRegex.test(address)) {
    return false;
  }

  try {
    const decoded = base58.decode(address);
    // The decoded address is 21 bytes; the first byte should be 0x41 (which is the Tron network prefix)
    if (decoded[0] !== 0x41) {
      return false;
    }

    if (decoded.length !== 25) {
      return false;
    }

    // ensure checksum is correct
    const hex = bytesToHex(decoded);
    const checkSum0 = hex.substring(hex.length - 8, hex.length);
    const checkSum1 = sha256(sha256(hex.substring(0, hex.length - 8) as Hex)).substring(2, 10);

    if (checkSum0 !== checkSum1) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
