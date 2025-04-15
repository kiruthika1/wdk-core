import {Address} from '@ton/core';

export const isTonAddress = (address: string) => {
  try {
    return /^(0|-1):([a-f0-9]{64}|[A-F0-9]{64})$/.test(Address.parse(address).toRawString());
  } catch (error) {
    return false;
  }
};
