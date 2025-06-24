// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import * as bip39 from 'bip39'

/** @typedef {import('@wdk/wallet').FeeRates} FeeRates */

/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */
/** @typedef {import('@wdk/wallet').IWalletAccount} IWalletAccount */

/** @typedef {import('@wdk/wallet-evm').EvmWalletConfig} EvmWalletConfig */
/** @typedef {import('@wdk/wallet-evm-erc-4337').EvmErc4337WalletConfig} EvmErc4337WalletConfig */

/** @typedef {import('@wdk/wallet-ton').TonWalletConfig} TonWalletConfig */
/** @typedef {import('@wdk/wallet-ton-gasless').TonGaslessWalletConfig} TonGaslessWalletConfig */

/** @typedef {import('@wdk/wallet-btc').BtcWalletConfig} BtcWalletConfig */

/** @typedef {import('@wdk/wallet-spark').SparkWalletConfig} SparkWalletConfig */

/** @typedef {import('@wdk/wallet-tron').TronWalletConfig} TronWalletConfig */

/** @typedef {string | Uint8Array} Seed */

/**
 * @typedef {Object} Seeds
 * @property {Seed} ethereum - The ethereum's wallet seed phrase.
 * @property {Seed} arbitrum - The arbitrum's wallet seed phrase.
 * @property {Seed} polygon - The polygon's wallet seed phrase.
 * @property {Seed} ton - The ton's wallet seed phrase.
 * @property {Seed} bitcoin - The bitcoin's wallet seed phrase.
 * @property {Seed} spark - The spark's wallet seed phrase.
 * @property {Seed} tron - The tron's wallet seed phrase.
 */

/**
 * @typedef {Object} WdkConfig
 * @property {EvmWalletConfig | EvmErc4337WalletConfig} ethereum - The ethereum blockchain configuration.
 * @property {EvmWalletConfig | EvmErc4337WalletConfig} arbitrum - The arbitrum blockchain configuration.
 * @property {EvmWalletConfig | EvmErc4337WalletConfig} polygon - The polygon blockchain configuration.
 * @property {TonWalletConfig | TonGaslessWalletConfig} ton - The ton blockchain configuration.
 * @property {BtcWalletConfig} bitcoin - The bitcoin blockchain configuration.
 * @property {SparkWalletConfig} spark - The spark blockchain configuration.
 * @property {TronWalletConfig} tron - The tron blockchain configuration.
 */

/**
 * @typedef {Object} TransferConfig
 * @property {number} [transferMaxFee] - The maximum fee amount for transfer operations.
 * @property {Object} paymasterToken - The paymaster token configuration.
 * @property {string} paymasterToken.address - The address of the paymaster token.
 */

/**
 * Enumeration for all available blockchains.
 *
 * @enum {string}
 */
export const Blockchain = {
  Ethereum: 'ethereum',
  Arbitrum: 'arbitrum',
  Polygon: 'polygon',
  Ton: 'ton',
  Bitcoin: 'bitcoin',
  Spark: 'spark',
  Tron: 'tron'
}

const EVM_BLOCKCHAINS = [
  Blockchain.Ethereum,
  Blockchain.Arbitrum,
  Blockchain.Polygon
]

export default class WdkManager {
  /**
   * Creates a new wallet development kit manager.
   *
   * @param {Seed | Seeds} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase to use for
   *                                             all blockchains, or an object mapping each blockchain to a different seed phrase.
   * @param {WdkConfig} config - The configuration for each blockchain.
   */
  constructor (seed, config) {
    /** @private */
    this._seed = seed

    /** @private */
    this._config = config

    /** @private */
    this._wallets = { }

    /** @private */
    this._account_abstraction_wallets = { }
  }

  /**
   * Returns a random [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   *
   * @returns {string} The seed phrase.
   *
   * @example
   * const seed = WdkManager.getRandomSeedPhrase();
   *
   * // Output: atom raven insect ...
   * console.log(seed);
   */
  static getRandomSeedPhrase () {
    return bip39.generateMnemonic()
  }

  /**
   * Checks if a seed phrase is valid.
   *
   * @param {string} seed - The seed phrase.
   * @returns {boolean} True if the seed phrase is valid.
   */
  static isValidSeedPhrase (seed) {
    return bip39.validateMnemonic(seed)
  }

  /**
   * Returns the wallet account for a specific blockchain and index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @example
   * // Return the account for the ethereum blockchain with derivation path m/44'/60'/0'/0/1
   * const account = await wdk.getAccount("ethereum", 1);
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<IWalletAccount>} The account.
  */
  async getAccount (blockchain, index = 0) {
    const wallet = await this._getWalletManager(blockchain)

    return await wallet.getAccount(index)
  }

  /**
   * Returns the wallet abstracted account for a specific blockchain and index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   * 
   * Note that the given blockchain must support account abstraction features for this method to work properly.
   *
   * @example
   * // Return the abstracted account for the ethereum blockchain with derivation path m/44'/60'/0'/0/1
   * const account = await wdk.getAbstractedAccount("ethereum", 1);
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<IWalletAccount>} The account.
  */
  async getAbstractedAccount (blockchain, index = 0) {
    const wallet = await this._getWalletManagerWithAccountAbstraction(blockchain)

    return await wallet.getAccount(index)
  }

  /**
   * Returns the wallet account for a specific blockchain and BIP-44 derivation path.
   *
   * @example
   * // Returns the account for the ethereum blockchain with derivation path m/44'/60'/0'/0/1
   * const account = await wdk.getAccountByPath("ethereum", "0'/0/1");
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<IWalletAccount>} The account.
   */
  async getAccountByPath (blockchain, path) {
    const wallet = await this._getWalletManager(blockchain)

    return await wallet.getAccountByPath(path)
  }

  /**
   * Returns the wallet abstracted account for a specific blockchain and BIP-44 derivation path.
   * 
   * Note that the given blockchain must support account abstraction features for this method to work properly.
   *
   * @example
   * // Returns the abstracted account for the ethereum blockchain with derivation path m/44'/60'/0'/0/1
   * const account = await wdk.getAbstractedAccountByPath("ethereum", "0'/0/1");
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<IWalletAccount>} The account.
   */
  async getAbstractedAccountByPath (blockchain, path) {
    const wallet = await this._getWalletManagerWithAccountAbstraction(blockchain)

    return await wallet.getAccountByPath(path)
  }

  /**
   * Returns the current fee rates for a specific blockchain.
   *
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @returns {Promise<FeeRates>} The fee rates.
   */
  async getFeeRates (blockchain) { 
    const wallet = await this._getWalletManager(blockchain)

    return await wallet.getFeeRates()
  }

  /**
   * Returns the abstracted address of an account.
   *
   * @deprecated since version 1.0.0-beta.2
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @returns {Promise<string>} The abstracted address.
   *
   * @example
   * // Get the abstracted address of the ethereum wallet's account at m/44'/60'/0'/0/3
   * const abstractedAddress = await wdk.getAbstractedAddress("ethereum", 3);
   */
  async getAbstractedAddress (blockchain, accountIndex) {
    const account = await this.getAbstractedAccount(blockchain, accountIndex)

    return await account.getAddress()
  }

  /**
   * Returns the native token balance of an abstracted address.
   *
   * @deprecated since version 1.0.0-beta.2
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @returns {Promise<number>} The native token balance (in base unit).
   */
  async getAbstractedAddressBalance (blockchain, accountIndex) {
    const account = await this.getAbstractedAccount(blockchain, accountIndex)

    return await account.getBalance()
  }

  /**
   * Returns the balance of an abstracted address for a specific token.
   *
   * @deprecated since version 1.0.0-beta.2
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {string} tokenAddress - The smart contract address of the token
   * @returns {Promise<number>} The token balance (in base unit).
   */
  async getAbstractedAddressTokenBalance (blockchain, accountIndex, tokenAddress) {
    const account = await this.getAbstractedAccount(blockchain, accountIndex)

    return await account.getTokenBalance(tokenAddress)
  }

  /**
   * Returns the paymaster token balance of an abstracted address.
   *
   * @deprecated since version 1.0.0-beta.2
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @returns {Promise<number>} The paymaster token balance (in base unit).
   */
  async getAbstractedAddressPaymasterTokenBalance (blockchain, accountIndex) {
    const account = await this.getAbstractedAccount(blockchain, accountIndex)

    const { paymasterToken: { address } } = this._config[blockchain]

    return await account.getTokenBalance(address)
  }

  /**
   * Transfers a token to another address.
   *
   * @deprecated since version 1.0.0-beta.2
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {TransferOptions} options - The transfer's options.
   * @param {TransferConfig} [config] - If set, overrides the 'transferMaxFee' and 'paymasterToken' options defined in the manager configuration.
   * @returns {Promise<TransferResult>} The transfer's result.
   *
   * @example
   * // Transfer 1.0 USDT from the ethereum wallet's account at index 0 to another address
   * const transfer = await wdk.transfer("ethereum", 0, {
   *     recipient: "0xabc...",
   *     token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
   *     amount: 1_000_000
   * });
   *
   * console.log("Transaction hash:", transfer.hash);
   */
  async transfer (blockchain, accountIndex, options, config) {
    const account = await this.getAbstractedAccount(blockchain, accountIndex)

    return await account.transfer(options, config)
  }

  /**
   * Quotes the costs of a transfer operation.
   *
   * @deprecated since version 1.0.0-beta.2
   * @see {@link transfer}
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {TransferOptions} options - The transfer's options.
   * @param {TransferConfig} [config] - If set, overrides the 'transferMaxFee' and 'paymasterToken' options defined in the manager configuration.
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   *
   * @example
   * // Quote the transfer of 1.0 USDT from the ethereum wallet's account at index 0 to another address
   * const quote = await wdk.quoteTransfer("ethereum", 0, {
   *     recipient: "0xabc...",
   *     token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
   *     amount: 1_000_000
   * });
   *
   * console.log("Gas cost in paymaster token:", quote.fee);
   */
  async quoteTransfer (blockchain, accountIndex, options, config) {
    const account = await this.getAbstractedAccount(blockchain, accountIndex)

    return await account.quoteTransfer(options, config)
  }

  /** Disposes all the wallet accounts, erasing their private keys from the memory. */
  dispose () {
    for (const blockchain in this._wallets) {
      this._wallets[blockchain].dispose()
    }

    for (const blockchain in this._account_abstraction_wallets) {
      this._account_abstraction_wallets[blockchain].dispose()
    }
  }

  /** @private */
  async _getWalletManager (blockchain) {
    if (!Object.values(Blockchain).includes(blockchain)) {
      throw new Error(`Unsupported blockchain: ${blockchain}.`)
    }

    if (!this._wallets[blockchain]) {
      const seed = (typeof this._seed === 'string' || this._seed instanceof Uint8Array) 
        ? this._seed 
        : this._seed[blockchain]
      
      const config = this._config

      if (EVM_BLOCKCHAINS.includes(blockchain)) {
        const { default: WalletManagerEvm } = await import('@wdk/wallet-evm')

        this._wallets[blockchain] = new WalletManagerEvm(seed, config[blockchain])
      }
      else if (blockchain === 'ton') {
        const { default: WalletManagerTon } = await import('@wdk/wallet-ton')

        this._wallets.ton = new WalletManagerTon(seed, config.ton)
      }
      else if (blockchain === 'bitcoin') {
        const { default: WalletManagerBtc } = await import('@wdk/wallet-btc')

        this._wallets.bitcoin = new WalletManagerBtc(seed, config.bitcoin)
      }
      else if (blockchain === 'spark') {
        const { default: WalletManagerSpark } = await import('@wdk/wallet-spark')

        this._wallets.spark = new WalletManagerSpark(seed, config.spark)
      }
      else if (blockchain === 'tron') {
        const { default: WalletManagerTron } = await import('@wdk/wallet-tron')

        this._wallets.tron = new WalletManagerTron(seed, config.tron)
      }
    }

    return this._wallets[blockchain]
  }

  /** @private */
  async _getWalletManagerWithAccountAbstraction (blockchain) {
    if (![...EVM_BLOCKCHAINS, Blockchain.Ton].includes(blockchain)) {
      throw new Error(`Account abstraction unsupported for blockchain: ${blockchain}.`)
    }

    if (!this._account_abstraction_wallets[blockchain]) {
      const seed = (typeof this._seed === 'string' || this._seed instanceof Uint8Array) 
        ? this._seed 
        : this._seed[blockchain]
      
      const config = this._config

      if (EVM_BLOCKCHAINS.includes(blockchain)) {
        const { default: WalletManagerEvmErc4337 } = await import('@wdk/wallet-evm-erc-4337')

        this._account_abstraction_wallets[blockchain] = new WalletManagerEvmErc4337(seed, config[blockchain])
      }
      else if (blockchain === 'ton') {
        const { default: WalletManagerTonGasless } = await import('@wdk/wallet-ton-gasless')
        
        this._account_abstraction_wallets.ton = new WalletManagerTonGasless(seed, config.ton)
      }
    }

    return this._account_abstraction_wallets[blockchain]
  }
}
