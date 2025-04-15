import type {TronWebProvider} from './types';
import {TronWeb} from 'tronweb';

/**
 * Converts an address to Tron format
 * If the address starts with '0x', converts from hex format to Tron format
 * Otherwise returns the address as is
 */
export function toTronAddress(tronWeb: TronWebProvider, address: string): string {
  if (address.startsWith('0x')) {
    return tronWeb.address.fromHex(address);
  }
  return address;
}

export function fromTronAddress(address: string): string {
  return TronWeb.address.toHex(address);
}
