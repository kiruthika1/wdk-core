import {Address} from '@ton/ton';
import {Cell} from '@ton/core';

export type TonTransaction = {
  messages: {
    address: Address;
    amount: string; // In Nano-ton
    stateInit?: Cell;
    payload?: Cell;
  }[];
};

export type TonSigner = {
  sendTransaction(payload: TonTransaction): Promise<string>; // Returns boc as a string

  signTransaction<Transaction extends TonTransaction>(payload: Transaction): Promise<Transaction>;

  getAddress(): Address;
};
