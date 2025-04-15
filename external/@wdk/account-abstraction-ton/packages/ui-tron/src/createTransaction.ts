import type {ChainKey, Transaction, TransactionResult} from '@wdk-account-abstraction-ton/ui-core';
import type {TronWeb} from 'tronweb';
import type * as tronTypes from './types';

type Signer = tronTypes.Signer;

interface CreateTransactionOptions {
  chainKey?: ChainKey;
  tronWeb: TronWeb;
}

export function createTransaction<
  PopulatedTransaction extends {transaction: tronTypes.Transaction},
>(
  populatedTransaction: PopulatedTransaction,
  options: CreateTransactionOptions,
): Transaction<Signer, PopulatedTransaction> {
  return {
    async signAndSubmitTransaction(signer: Signer): Promise<TransactionResult> {
      const signedTransaction = await signer.signTransaction(populatedTransaction.transaction);

      return {
        txHash: hexZeroPad(signedTransaction.txID as string),
        wait: async () => {
          const broadcastResult = await options.tronWeb.trx.sendRawTransaction(
            //
            signedTransaction as any,
          );
          return {
            txHash: hexZeroPad(broadcastResult.transaction.txID as string),
          };
        },
      };
    },
    // biome-ignore lint/correctness/noUnusedVariables: interface
    async estimateGas(signer) {
      throw new Error('Not implemented');
    },
    // biome-ignore lint/correctness/noUnusedVariables: interface
    async estimateNative(signer) {
      throw new Error('Not implemented');
    },
    async unwrap() {
      return populatedTransaction;
    },
  };
}

function hexZeroPad(txHash: string) {
  if (txHash.startsWith('0x')) return txHash;
  // biome-ignore lint/style/useTemplate: faster
  return '0x' + txHash;
}
