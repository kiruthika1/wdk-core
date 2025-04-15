import {
  type BalanceProvider,
  type Currency,
  CurrencyAmount,
  isToken,
  isSolanaChainKey,
  isNativeCurrency,
  type Token,
  assert,
} from '@wdk-account-abstraction-ton/ui-core';
import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {PublicKey, type Connection} from '@solana/web3.js';
import memoize from 'moize';

export class BalanceProvider__solana implements BalanceProvider {
  constructor(
    private readonly connection: Connection,
    protected config: {
      // in ms, default 4_000
      cacheTime?: number;
      // in ms, default 1_000
      cacheSize?: number;
    } = {},
  ) {
    const options = Object.assign({
      isPromise: true,
      updateExpire: true,
      maxSize: config.cacheSize ?? 1_000,
      maxAge: config.cacheTime ?? 4_000,
    });
    this.getTokenBalancesByMint = memoize(this.getTokenBalancesByMint.bind(this), options);
    this.getNativeBalance = memoize(this.getNativeBalance.bind(this), options);
  }

  supports(token: Currency): boolean {
    return isSolanaChainKey(token.chainKey);
  }

  protected async getTokenBalancesByMint(address: string) {
    const userPublicKey = new PublicKey(address);
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(userPublicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    // groupBy mint
    const result = Object.fromEntries(
      tokenAccounts.value.map((value) => [
        value.account.data.parsed.info.mint,
        value.account.data.parsed,
      ]),
    );
    return result as Record<string, ParsedData>;
  }

  protected async getTokenBalance(token: Token, address: string): Promise<CurrencyAmount> {
    const tokenBalances = await this.getTokenBalancesByMint(address);
    const balance = tokenBalances[token.address];
    if (balance === undefined) {
      return CurrencyAmount.fromRawAmount(token, 0);
    }
    if (balance.info.tokenAmount.decimals !== token.decimals) {
      // check decimals to prevent unexpected behavior
      throw new Error(
        `Token decimals mismatch: expected ${token.decimals}, got ${balance.info.tokenAmount.decimals}`,
        {cause: {token, balance}},
      );
    }
    return CurrencyAmount.fromRawAmount(token, balance.info.tokenAmount.amount);
  }

  async getBalance(currency: Currency, address: string): Promise<CurrencyAmount> {
    if (isNativeCurrency(currency)) {
      const amount = await this.getNativeBalance(address);
      return CurrencyAmount.fromRawAmount(currency, amount);
    }
    assert(isToken(currency));
    return this.getTokenBalance(currency, address);
  }

  protected async getNativeBalance(address: string): Promise<number> {
    const userPublicKey = new PublicKey(address);
    return this.connection.getBalance(userPublicKey);
  }
}

interface ParsedData {
  type: 'account' | string;
  info: {
    isNative: boolean;
    mint: string;
    owner: string;
    state: 'initialized' | string;
    tokenAmount: {
      amount: string;
      decimals: number;
    };
  };
}
