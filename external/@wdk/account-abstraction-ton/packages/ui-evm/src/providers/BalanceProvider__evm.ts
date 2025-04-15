import {
  assert,
  isEvmAddress,
  type BalanceProvider,
  isCoin,
  type Currency,
  CurrencyAmount,
  type Coin,
  isToken,
  tryGetNetwork,
  ChainType,
} from '@wdk-account-abstraction-ton/ui-core';
import {ERC20__factory} from '../typechain';
import type {ProviderFactory} from '../providerFactory';

export class BalanceProvider__evm implements BalanceProvider {
  constructor(private readonly providerFactory: ProviderFactory) {}
  supports(token: Currency) {
    return tryGetNetwork(token.chainKey)?.chainType === ChainType.EVM;
  }

  getBalance(token: Currency, address: string): Promise<CurrencyAmount<Currency>> {
    if (isCoin(token)) return this.getNativeBalance(token, address);
    if (isToken(token)) return this.getErc20Balance(token, address);
    throw new Error('Invalid token');
  }

  async getNativeBalance(token: Coin, address: string): Promise<CurrencyAmount<Currency>> {
    assert(isEvmAddress(address), 'Non EVM address');
    assert(isCoin(token));
    const balance = await this.providerFactory(token.chainKey).getBalance(address);
    return CurrencyAmount.fromBigInt(token, balance.toBigInt());
  }

  async getErc20Balance(token: Currency, address: string): Promise<CurrencyAmount<Currency>> {
    assert(isEvmAddress(address), 'Non EVM address');
    assert(isToken(token));
    try {
      const erc20 = ERC20__factory.connect(token.address, this.providerFactory(token.chainKey));
      const balance = await erc20.balanceOf(address);
      return CurrencyAmount.fromBigInt(token, balance.toBigInt());
    } catch (e) {
      console.error(
        `Error fetching balance for token ${token.address} on ${token.chainKey} for ${address}`,
        e,
      );
      throw e;
    }
  }
}
