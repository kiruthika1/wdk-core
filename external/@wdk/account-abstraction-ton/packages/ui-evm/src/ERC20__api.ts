import {
  type Currency,
  CurrencyAmount,
  isToken,
  Token,
  type Transaction,
  assert,
} from '@wdk-account-abstraction-ton/ui-core';
import type {BigNumber, Signer} from 'ethers';
import type {Log, Provider} from '@ethersproject/abstract-provider';
import {ERC20__factory} from './typechain/factories/ERC20__factory';
import type {ERC20 as ERC20__contract} from './typechain/ERC20';
import pMemoize from 'p-memoize';
import {createTransaction} from './createTransaction';
import type {ProviderFactory} from './providerFactory';

export type ERC20Event = {
  event: {
    name: string;
    namespace: 'ERC20';
  };
  args: {
    from: string;
    to: string;
    value: CurrencyAmount;
  };
  address: string;
  chainKey: string;
};

class ERC20 {
  constructor(
    public readonly token: Token,
    public readonly contract: ERC20__contract,
  ) {}

  async balanceOf(account: string) {
    const balance: BigNumber = await this.contract.balanceOf(account);
    return CurrencyAmount.fromBigInt(this.token, balance.toBigInt());
  }

  async allowance(owner: string, spender: string) {
    const amount: BigNumber = await this.contract.allowance(owner, spender);
    return CurrencyAmount.fromBigInt(this.token, amount.toBigInt());
  }

  async totalSupply() {
    const totalSupply: BigNumber = await this.contract.totalSupply();
    return CurrencyAmount.fromBigInt(this.token, totalSupply.toBigInt());
  }

  async approve(amount: CurrencyAmount, spender: string): Promise<Transaction<Signer>> {
    assert(amount.token.equals(this.token), 'token');
    const {contract} = this;
    const populatedTransaction = contract.populateTransaction.approve(spender, amount.quotient);

    return createTransaction(populatedTransaction, {
      provider: contract.provider,
      chainKey: this.token.chainKey,
    });
  }
}

async function getToken(chainKey: string, address: string, provider: Provider) {
  const erc20 = ERC20__factory.connect(address, provider);
  const [symbol, decimals, name] = await Promise.all([
    erc20.symbol(),
    erc20.decimals(),
    erc20.name(),
  ]);
  return Token.from({chainKey, address, decimals, symbol, name});
}

export class ERC20__api {
  constructor(protected providerFactory: ProviderFactory) {}
  forToken(currency: Currency): ERC20 {
    assert(isToken(currency), 'token');
    const provider = this.providerFactory(currency.chainKey);
    const contract = ERC20__factory.connect(currency.address, provider);
    return new ERC20(currency, contract);
  }

  getToken = pMemoize(
    ({chainKey, address}: {chainKey: string; address: string}): Promise<Token> => {
      return getToken(chainKey, address, this.providerFactory(chainKey));
    },
    {
      cacheKey: ([{chainKey, address}]) => chainKey + ':' + address.toLowerCase(),
    },
  );

  async getTransferEvents(chainKey: string, txHash: string): Promise<ERC20Event[]> {
    const provider = this.providerFactory(chainKey);
    const receipt = await provider.getTransactionReceipt(txHash);

    const events = await Promise.all(
      receipt.logs.map((log) => this.tryParseTransferEvent(chainKey, log)),
    );
    return events.flatMap((event) => (event ? [event] : []));
  }

  async tryParseTransferEvent(chainKey: string, log: Log): Promise<ERC20Event | undefined> {
    const iface = ERC20__factory.createInterface();
    const event = iface.getEvent('Transfer');
    const topicHash = iface.getEventTopic(event);
    if (log.topics[0] !== topicHash) return undefined;
    try {
      const description = iface.parseLog(log);
      const tokenAddress = log.address;
      const token = await this.getToken({chainKey, address: tokenAddress});
      const value = CurrencyAmount.fromBigInt(token, description.args.value.toBigInt());
      return {
        event: {
          name: event.name,
          namespace: 'ERC20',
        },
        args: {
          from: description.args.from,
          to: description.args.to,
          value,
        },
        address: tokenAddress,
        chainKey,
      };
    } catch {
      // not ERC20
    }
  }
}
