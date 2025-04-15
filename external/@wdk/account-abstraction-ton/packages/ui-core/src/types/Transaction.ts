import type {CurrencyAmount} from '../fraction';

export type TransactionResult = {
  txHash: string;
  wait(): Promise<{txHash: string}>;
};

export type Transaction<Signer, RawTransaction = unknown> = {
  signAndSubmitTransaction(signer: Signer): Promise<TransactionResult>;
  estimateGas(signer?: Signer): Promise<bigint>;
  estimateNative(signer?: Signer): Promise<CurrencyAmount>;
  unwrap(): Promise<RawTransaction>;
};
