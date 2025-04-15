import {
  assert,
  type Currency,
  CurrencyAmount,
  getNativeCurrency,
  isToken,
  type Transaction,
} from '@wdk-account-abstraction-ton/ui-core';
import type {AptosClient, Types} from 'aptos';
import type {AptosResourceProvider} from './AptosResourceProvider';
import type {AptosSigner} from './types/AptosSigner';

export class AptosManagedCoinRegisterService {
  constructor(
    private readonly aptosClient: AptosClient,
    private readonly resourceProvider: AptosResourceProvider,
  ) {}

  async isRegistered(resource: Currency, address: string): Promise<boolean> {
    const resources = await this.resourceProvider.getAccountResources(address);
    const type = getResourceType(resource);
    return resources.some((other) => other.type === type);
  }

  async registerCoin(token: Currency): Promise<Transaction<AptosSigner>> {
    const {aptosClient} = this;
    assert(isToken(token));
    assert(aptosClient);
    const coinType = token.address;

    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: `0x1::managed_coin::register`,
      type_arguments: [coinType],
      arguments: [],
    };

    const tx: Transaction<AptosSigner> = {
      async unwrap() {
        return payload;
      },
      async signAndSubmitTransaction(signer) {
        const response = await signer.sendTransaction(payload);
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
      async estimateGas(signer) {
        // can't call client.simulateTransaction()
        // because no publicKey is available in the wallet adapter (yet)

        // using value from this tx
        // https://explorer.aptoslabs.com/txn/0xddb86441811bdd9fe6968a9932cfb41be62afe3a27f73c1fd4b361ebaa7847c3?network=testnet
        const gasUnits = 658;
        return BigInt(gasUnits);
      },
      async estimateNative(signer: AptosSigner): Promise<CurrencyAmount<Currency>> {
        const {gas_estimate: gasPrice} = await aptosClient.estimateGasPrice();
        const gasUnits = await tx.estimateGas(signer);
        const estimate = Number(gasUnits) * gasPrice * 4;

        const native = getNativeCurrency(token.chainKey);
        return CurrencyAmount.fromRawAmount(native, estimate);
      },
    };

    return tx;
  }
}

function getResourceType(token: Currency) {
  if (isToken(token)) {
    const type = `0x1::coin::CoinStore<${token.address}>`;
    return type;
  }
  return undefined;
}
