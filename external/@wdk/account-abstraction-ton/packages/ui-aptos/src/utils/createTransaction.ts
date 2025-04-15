import type {AptosClient, Types} from 'aptos';
import type {AptosSigner} from '../types/AptosSigner';
import type {CurrencyAmount, Transaction, TransactionResult} from '@wdk-account-abstraction-ton/ui-core';

export function createTransaction(
  entryFunctionPayload: Types.EntryFunctionPayload,
  {client: aptosClient}: {client: AptosClient},
) {
  const tx: Transaction<AptosSigner, Types.EntryFunctionPayload> = {
    async unwrap() {
      return entryFunctionPayload;
    },
    async signAndSubmitTransaction(signer: AptosSigner): Promise<TransactionResult> {
      const response = await signer.sendTransaction(entryFunctionPayload as any);
      return {
        txHash: response.hash,
        async wait() {
          const result = await aptosClient.waitForTransactionWithResult(response.hash, {
            checkSuccess: true,
          });
          return {
            txHash: result.hash,
          };
        },
      };
    },
    estimateGas(_: AptosSigner): Promise<bigint> {
      throw new Error('Method not implemented.');
    },
    estimateNative: (_: AptosSigner): Promise<CurrencyAmount> => {
      throw new Error('Function not implemented.');
    },
  };

  return tx;
}
