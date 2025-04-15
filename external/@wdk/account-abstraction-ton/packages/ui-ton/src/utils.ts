import {toBigIntBE, toBufferBE} from 'bigint-buffer';
import {Address} from '@ton/ton';
import {trimStart} from 'lodash';
import {beginCell, Cell, Slice} from '@ton/core';

function isHexString(value: any, length?: number): boolean {
  if (typeof value !== 'string' || !value.match(/^(0x)?[0-9A-Fa-f]*$/)) {
    return false;
  }
  if (length && value.length !== 2 + 2 * length) {
    return false;
  }
  return true;
}

function to32ByteBuffer(
  value: bigint | number | string | Uint8Array,
  maxIntermediateBufferSize = 66,
): Buffer {
  if (typeof value === 'string') {
    if (!isHexString(value)) {
      throw new Error('only hex string is supported');
    }
    let hex = trimStart(value, '0x');
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    value = toBigIntBE(Buffer.from(hex, 'hex'));
  }
  if (value instanceof Uint8Array) {
    value = toBigIntBE(Buffer.from(value));
  }
  const bf = toBufferBE(BigInt(value), maxIntermediateBufferSize);
  // trim from the left, keep the right 32 bytes
  return bf.subarray(-32);
}

export function bigintToAddress(value: bigint): Address {
  const buf = to32ByteBuffer(value);
  return Address.parse(`0:${buf.toString('hex')}`);
}

type AddressTypeLike = Address | string | bigint;

export const parseTonAddress = (address: AddressTypeLike) => {
  if (address instanceof Address) {
    return address;
  }

  if (typeof address === 'bigint' || typeof address === 'number') {
    return bigintToAddress(BigInt(address));
  }

  if (address.startsWith('0x')) {
    // If it's a hex address format it to ton format
    return bigintToAddress(BigInt(address));
  }

  try {
    return Address.parse(address);
  } catch (e) {
    // handles the case where the address is hex format without leading 0x
    return bigintToAddress(BigInt(`0x${address}`));
  }
};

export const tonAddressToHex = (tonAddress: string) => {
  parseTonAddress('kQAIO31lsBFFFxz8EaOaPcsorplKMZR1VPROiPY-9IOz2rzO').toRawString();
};

export const arrayBufferToBase64 = (buffer: Buffer) => {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const buildTonTransferCell = (
  opts: {
    value: bigint;
    fromAddress?: Address;
    toAddress: Address;
    queryId?: number;
    fwdAmount: bigint;
    jettonAmount: bigint;
  } & (
    | {
        forwardPayload?: Cell | Slice | null;
      }
    | {
        comment: string;
      }
  ),
) => {
  const builder = beginCell()
    .storeUint(0xf8a7ea5, 32) // Transfer
    .storeUint(opts.queryId ?? 69, 64)
    .storeCoins(opts.jettonAmount)
    .storeAddress(opts.toAddress)
    .storeAddress(opts.fromAddress)
    .storeUint(0, 1)
    .storeCoins(opts.fwdAmount);

  if ('comment' in opts) {
    const commentPayload = beginCell().storeUint(0, 32).storeStringTail(opts.comment).endCell();

    builder.storeBit(1);
    builder.storeRef(commentPayload);
  } else {
    if (opts.forwardPayload instanceof Slice) {
      builder.storeBit(0);
      builder.storeSlice(opts.forwardPayload);
    } else if (opts.forwardPayload instanceof Cell) {
      builder.storeBit(1);
      builder.storeRef(opts.forwardPayload);
    } else {
      builder.storeBit(0);
    }
  }
  return builder.endCell();
};

const _addressToNotPaddedHex = (address: AddressTypeLike): string => {
  return `0x${parseTonAddress(address).hash.toString('hex')}`;
};
export const addressToBigInt = (address: AddressTypeLike): bigint => {
  return BigInt(_addressToNotPaddedHex(address));
};

export const bigIntToAddress = (address: bigint): Address => {
  return parseTonAddress('0x' + address.toString(16));
};

export const emptyCell = (): Cell => {
  return beginCell().asCell();
};

export const asciiStringToBigint = (target: string): bigint => {
  return BigInt(`0x${Buffer.from(target).toString('hex')}`);
};
