import type {Types} from 'aptos';

export type AptosTransaction = Types.TransactionPayload;

export type AptosSubmitOptions = {};

export type AptosSigner = {
  sendTransaction(
    payload: Types.TransactionPayload,
    options?: AptosSubmitOptions,
  ): Promise<{hash: string}>;
};
