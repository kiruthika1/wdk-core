import type {Transaction, Connection, VersionedTransaction, SendOptions} from '@solana/web3.js';

export type SolanaTransaction = Transaction | VersionedTransaction;
export interface SolanaSubmitOptions extends SendOptions {
  connection: Connection;
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface SolanaSignOptions {}

export type SolanaSigner = {
  sendTransaction(
    payload: SolanaTransaction,
    options: SolanaSubmitOptions,
  ): Promise<{hash: string}>;

  signTransaction<Transaction extends SolanaTransaction>(
    payload: Transaction,
    options: SolanaSignOptions,
  ): Promise<Transaction>;
};
