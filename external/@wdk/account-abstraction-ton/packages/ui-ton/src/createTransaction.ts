import {Transaction, TransactionResult} from '@wdk-account-abstraction-ton/ui-core';
import {TonSigner, TonTransaction} from './TonSigner';
import {Address, storeMessage, TonClient} from '@ton/ton';
import {beginCell, Cell, Transaction as TonClientTransaction} from '@ton/core';
import {bigintToAsciiString, clGetUint} from '@layerzerolabs/lz-ton-sdk-v2';

type CreateTransactionOptions = {
  client: TonClient;
};

interface WaitForTransactionProps {
  refetchInterval?: number;
  refetchLimit?: number;
  address: Address;
}

const waitForTransaction = async (
  options: WaitForTransactionProps,
  client: TonClient,
  checkEqual: (a: TonClientTransaction) => boolean,
): Promise<TonClientTransaction | null> => {
  const {refetchInterval = 3000, refetchLimit, address} = options;

  return new Promise((resolve) => {
    let refetches = 0;
    const walletAddress = address;
    const interval = setInterval(async () => {
      refetches += 1;

      const state = await client.getContractState(walletAddress);
      if (!state || !state.lastTransaction) {
        clearInterval(interval);
        resolve(null);
        return;
      }

      const {lt: lastLt, hash: lastHash} = state.lastTransaction;
      const lastTx = await client.getTransaction(walletAddress, lastLt, lastHash);

      if (lastTx && lastTx.inMessage) {
        if (checkEqual(lastTx)) {
          clearInterval(interval);
          resolve(lastTx);
        }
      }

      if (refetchLimit && refetches >= refetchLimit) {
        clearInterval(interval);
        resolve(null);
      }
    }, refetchInterval);
  });
};

export function createTransaction(
  populatedTransaction: TonTransaction,
  options: CreateTransactionOptions,
): Transaction<TonSigner> {
  const {client} = options;
  async function unwrap() {
    return populatedTransaction;
  }

  async function signAndSubmitTransaction(signer: TonSigner): Promise<TransactionResult> {
    const responseBoc = await signer.sendTransaction(populatedTransaction);

    const hash = Cell.fromBase64(responseBoc).hash().toString('hex');

    const transaction = await waitForTransaction(
      {
        address: signer.getAddress(),
      },
      client,
      (lastTx) => {
        if (lastTx.inMessage) {
          const msgCell = beginCell().store(storeMessage(lastTx.inMessage)).endCell();
          const inMsgHash = msgCell.hash().toString('hex');
          return inMsgHash === hash;
        }
        return false;
      },
    );
    if (!transaction) {
      throw new Error('Unable to confirm transaction is on chain');
    }

    return {
      txHash: '0x' + transaction.hash().toString('hex'),
      async wait() {
        await waitForTransaction(
          {
            address: signer.getAddress(),
          },
          client,
          (lastTx) => {
            if (lastTx.inMessage) {
              const msgCell = beginCell().store(storeMessage(lastTx.inMessage)).endCell();
              try {
                const subtopic = bigintToAsciiString(clGetUint(msgCell.refs[0]!, 0, 256));
                return subtopic === 'Channel::event::PACKET_SENT';
              } catch (error) {
                return false;
              }
            }
            return false;
          },
        );
        return {
          txHash: '0x' + transaction.hash().toString('hex'),
        };
      },
    };
  }

  const tx: Transaction<TonSigner, TonTransaction> = {
    signAndSubmitTransaction,
    estimateGas() {
      throw new Error('Not implemented');
    },
    estimateNative() {
      throw new Error('Not implemented');
    },
    unwrap,
  };
  return tx;
}
