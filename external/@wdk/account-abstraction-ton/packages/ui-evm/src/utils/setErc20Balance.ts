/* 
  This file is based on the hardhat-deal helpers: 
  https://github.com/Rubilmax/hardhat-deal/blob/master/src/helpers.ts 
*/
import type {JsonRpcProvider} from '@ethersproject/providers';
import {type BigNumberish, utils} from 'ethers';

const {Interface, solidityKeccak256, getAddress, hexZeroPad, hexlify} = utils;

export enum StorageLayoutType {
  SOLIDITY = 'solidity',
  VYPER = 'vyper',
}

const balanceOfIfc = new Interface(['function balanceOf(address) external view returns (uint256)']);

const getBalanceOfSlot = (type: StorageLayoutType, slot: number, recipient: string) => {
  if (type === StorageLayoutType.VYPER)
    return solidityKeccak256(
      ['uint256', 'uint256'],
      [slot, recipient], // slot, key (vyper)
    );

  return solidityKeccak256(
    ['uint256', 'uint256'],
    [recipient, slot], // key, slot (solidity)
  );
};

interface Cache {
  set(key: string, value: unknown): void;
  get(key: string): unknown;
  delete(key: string): void;
  has(key: string): boolean;
}

interface DealSlot {
  type: StorageLayoutType;
  slot: number;
}

const defaultCache: Cache = new Map();

export const setErc20Balance = async (
  {
    token: erc20,
    recipient,
    amount,
  }: {
    token: string;
    recipient: string;
    amount: BigNumberish;
  },
  provider: JsonRpcProvider,
  {
    maxSlot = 256,
    cache = defaultCache,
    log = false,
    // methods
    getStorageAt = 'eth_getStorageAt',
    setStorageAt = 'anvil_setStorageAt', // or hardhat_setStorageAt
  }: {
    maxSlot?: number;
    cache?: Cache;
    getStorageAt?: string;
    setStorageAt?: string;
    log?: boolean;
  } = {},
): Promise<DealSlot> => {
  const logger = log ? console : undefined;
  const [erc20Address, recipientAddress] = await Promise.all([
    getAddress(erc20),
    getAddress(recipient),
  ]);
  // might need to include chainId in the cache key
  const cacheKey = `${erc20Address}`;
  const hexAmount = hexZeroPad(hexlify(amount), 32);
  let dealSlot: DealSlot = {type: StorageLayoutType.SOLIDITY, slot: 0};

  const balanceOfCall = [
    {
      to: erc20Address,
      data: balanceOfIfc.encodeFunctionData('balanceOf', [recipientAddress]),
    },
  ];

  const trySlot = async () => {
    logger?.log(`Trying slot ${dealSlot.slot} with type ${dealSlot.type} for ${erc20Address} ...`);
    const balanceOfSlot = getBalanceOfSlot(dealSlot.type, dealSlot.slot, recipientAddress);

    const storageBefore = await provider.send(getStorageAt, [
      erc20Address,
      balanceOfSlot,
      'latest',
    ]);

    await provider.send(setStorageAt, [erc20Address, balanceOfSlot, hexAmount]);

    const balance = await provider.send('eth_call', balanceOfCall);

    if (balance === hexAmount) {
      return true;
    }

    await provider.send(setStorageAt, [erc20Address, balanceOfSlot, storageBefore]);

    return false;
  };

  const getNextDealSlot = () => {
    const {type, slot} = dealSlot;

    return {type, slot: slot + 1};
  };

  // Checking cache first
  if (cache.has(cacheKey)) {
    const slotNumber = Number(cache.get(cacheKey));
    if (!isNaN(slotNumber)) {
      dealSlot = {type: StorageLayoutType.SOLIDITY, slot: slotNumber};

      const successCacheSolidity = await trySlot();
      if (successCacheSolidity) return dealSlot;

      dealSlot = {type: StorageLayoutType.VYPER, slot: slotNumber};
      const successCacheVyper = await trySlot();
      if (successCacheVyper) return dealSlot;
    } else {
      logger?.log(`Deleting invalid cache value for ${cacheKey}`);
      // deleting invalid cache
      cache.delete(cacheKey);
    }
  }

  // checking solidity type first
  dealSlot = {type: StorageLayoutType.SOLIDITY, slot: 0};

  let success = await trySlot();

  while (!success && dealSlot.slot <= maxSlot) {
    dealSlot = getNextDealSlot();

    success = await trySlot();
  }
  // vyper layout is tried in case of solidity layout failure
  if (!success) {
    logger?.log('Solidity layout failed, checking with Vyper...');

    dealSlot.type = StorageLayoutType.VYPER;
    dealSlot.slot = 0;
    success = await trySlot();

    while (!success && dealSlot.slot <= maxSlot) {
      dealSlot = getNextDealSlot();
      success = await trySlot();
    }
  }

  // updating cache because the setStorageAt was successful for a given slot
  if (success) {
    cache.set(cacheKey, dealSlot.slot);
  }

  if (!success) throw Error(`Could not brute-force storage slot for ERC20 at: ${erc20Address}`);
  return dealSlot;
};
