import {TonClient} from '@ton/ton';
import {
  BalanceProvider,
  ChainType,
  type Currency,
  CurrencyAmount,
  getNativeCurrency,
  tryGetNetwork,
} from '@wdk-account-abstraction-ton/ui-core';
import {parseTonAddress} from '../utils';
import {UsdtMinter, UsdtWallet} from '../wrappers';
import {getJettonAddressFromWallet} from '../getJettonAddressFromWallet';

export class BalanceProvider__ton implements BalanceProvider {
  constructor(
    private readonly client: TonClient,
    private readonly minterAddress: string,
  ) {}

  async getBalance(token: Currency, address: string): Promise<CurrencyAmount> {
    const tonWalletAddress = parseTonAddress(address);
    if (token.symbol === 'TON') {
      return CurrencyAmount.fromRawAmount(
        getNativeCurrency(ChainType.TON),
        await this.client.getBalance(parseTonAddress(address)),
      );
    }
    return getJettonAddressFromWallet(this.getMinterContract(token), tonWalletAddress).then(
      (jettonWalletAddress) => {
        const provider = this.client.provider(jettonWalletAddress);
        const walletContract = provider.open(UsdtWallet.createFromAddress(jettonWalletAddress));
        return walletContract.getUsdtBalance().then((balance) => {
          return CurrencyAmount.fromRawAmount(token, balance);
        });
      },
    );
  }

  getMinterContract = (token: Currency) => {
    if (token.symbol === 'USDT0' || token.symbol === 'USDT') {
      const tonMinterAddress = parseTonAddress(this.minterAddress);
      return this.client.open(UsdtMinter.createFromAddress(tonMinterAddress));
    }
    throw new Error('Unsupported token');
  };

  supports(token: Currency): boolean {
    return tryGetNetwork(token.chainKey)?.chainType === ChainType.TON;
  }
}
