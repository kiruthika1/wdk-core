import {
  type ChainKey,
  ChainType,
  CurrencyAmount,
  getNetwork,
  getNetworkByNativeChainId,
  type Transaction,
  type TransactionResult,
} from '@wdk-account-abstraction-ton/ui-core';

import type {Provider} from '@ethersproject/providers';
import type {PopulatedTransaction} from '@ethersproject/contracts';
import {BigNumber, type Signer} from 'ethers';

type PromiseOrValue<T> = T | Promise<T>;
type EstimateGas = Transaction<Signer>['estimateGas'];
type EstimateNative = Transaction<Signer>['estimateNative'];
type GetGasPrice = () => Promise<bigint>;
type CreateTransactionOptions = {
  // eip-155 https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
  chainKey?: ChainKey;
  // signer address to validate
  sender?: string;
  // provider used to estimate gas price
  provider?: Provider;
  // overrides
  getGasPrice?: GetGasPrice;
  estimateGas?: EstimateGas;
  estimateNative?: EstimateNative;
};

const noop = {
  estimateGas() {
    throw new Error('estimateGas not implemented.');
  },
  estimateNative() {
    throw new Error('estimateNative not implemented.');
  },
} as const;

export function createTransaction(
  populatedTransaction: PromiseOrValue<PopulatedTransaction>,
  options: CreateTransactionOptions,
): Transaction<Signer, PopulatedTransaction> {
  const {provider, chainKey} = options;

  async function unwrap() {
    return populatedTransaction;
  }

  async function signAndSubmitTransaction(signer: Signer): Promise<TransactionResult> {
    const transactionRequest = await populatedTransaction;
    // TODO: TAIKO chain override
    if (chainKey === 'taiko' && provider) {
      const minGasPrice = BigNumber.from(90000000);
      const currentGasPrice = await provider.getGasPrice();
      const gasPrice = minGasPrice.gt(currentGasPrice) ? minGasPrice : currentGasPrice;
      transactionRequest.gasPrice = gasPrice;
    }

    if (chainKey) {
      applyEIP155(transactionRequest, chainKey);
    }
    const response = await signer.sendTransaction(transactionRequest);
    return {
      txHash: response.hash,
      async wait() {
        const receipt = await response.wait();
        return {
          txHash: receipt.transactionHash,
        };
      },
    };
  }

  if (provider) {
    const getGasPrice =
      options.getGasPrice ?? (() => provider.getGasPrice().then((p) => p.toBigInt()));

    const estimateGas = options.estimateGas ?? createEstimateGas(populatedTransaction, provider);
    const estimateNative =
      options.estimateNative ??
      async function estimateNative(signer: Signer): Promise<CurrencyAmount> {
        const nativeChainId = (await provider.getNetwork()).chainId;
        const native = getNetworkByNativeChainId(ChainType.EVM, nativeChainId).nativeCurrency;
        const [gasPrice, gasUsed] = await Promise.all([getGasPrice(), estimateGas(signer)]);
        const amount = gasPrice * gasUsed;
        return CurrencyAmount.fromRawAmount(native, amount);
      };
    const tx: Transaction<Signer, PopulatedTransaction> = {
      signAndSubmitTransaction,
      estimateGas,
      estimateNative,
      unwrap,
    };
    return tx;
  }

  const tx: Transaction<Signer, PopulatedTransaction> = {
    signAndSubmitTransaction,
    estimateGas: options.estimateGas ?? noop.estimateGas,
    estimateNative: options.estimateNative ?? noop.estimateNative,
    unwrap,
  };
  return tx;
}

export function createEstimateGas(
  populatedTransaction: PromiseOrValue<PopulatedTransaction>,
  provider: Provider,
): EstimateGas {
  return async (signer) => {
    return (signer ?? provider).estimateGas(await populatedTransaction).then((r) => r.toBigInt());
  };
}

function applyEIP155(transactionRequest: PopulatedTransaction, chainKey: ChainKey) {
  const chainId = getNetwork(chainKey).nativeChainId;
  if (typeof chainId !== 'number') throw new InvalidEvmChainIdError(chainId, chainKey);
  if (transactionRequest.chainId === undefined) {
    transactionRequest.chainId = chainId;
  }
  if (transactionRequest.chainId !== chainId) {
    throw new EIP155Error(transactionRequest, chainId);
  }
}

class InvalidEvmChainIdError extends Error {
  constructor(
    public readonly chainId: unknown,
    public readonly chainKey: ChainKey,
  ) {
    super(`EVM chainId must be number, got:${chainId}`);
  }
}

class EIP155Error extends Error {
  constructor(
    public readonly transaction: PopulatedTransaction,
    public readonly chainId: number,
  ) {
    super(
      `EIP155 error: chainId ${transaction.chainId} does not match requested chainId ${chainId}`,
    );
  }
}
