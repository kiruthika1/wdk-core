import type {Transaction} from '@wdk-account-abstraction-ton/ui-core';
import type {SolanaSigner, SolanaSubmitOptions, SolanaTransaction} from '../SolanaSigner';

export function createTransaction(
  populatedTransaction: SolanaTransaction,
  options: SolanaSubmitOptions,
): Transaction<SolanaSigner> {
  return {
    async unwrap() {
      return populatedTransaction;
    },
    estimateGas() {
      throw new Error('Not implemented');
    },
    async signAndSubmitTransaction(signer) {
      const latestBlockHash = await options.connection.getLatestBlockhashAndContext();
      const signedTransaction = await signer.signTransaction(populatedTransaction, {});
      const signature = await options.connection.sendRawTransaction(signedTransaction.serialize());
      return {
        txHash: signature,
        async wait() {
          const confirmation = await options.connection.confirmTransaction(
            {
              signature: signature,
              blockhash: latestBlockHash.value.blockhash,
              lastValidBlockHeight: latestBlockHash.value.lastValidBlockHeight,
            },
            'confirmed',
          );
          const error = confirmation.value.err;
          if (error) {
            throw new Error(`Confirmation of transaction ${signature} failed`, {cause: error});
          }
          return {
            txHash: signature,
          };
        },
      };
    },
    estimateNative() {
      throw new Error('Not implemented');
    },
  };
}
