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

import WalletManagerEvm from '@wdk/wallet-evm'
import AccountAbstractionManagerEvm from '@wdk/account-abstraction-evm'

import WalletManagerTon from '@wdk/wallet-ton'
import AccountAbstractionManagerTon from '@wdk/account-abstraction-ton'

import bip39 from 'bip39'

const ACCOUNT_ABSTRACTION_MANAGERS = {
  ethereum: AccountAbstractionManagerEvm,
  arbitrum: AccountAbstractionManagerEvm,
  polygon: AccountAbstractionManagerEvm,
  ton: AccountAbstractionManagerTon
}

/**
 * Enumeration for all available blockchains.
 *
 * @enum {string}
 */
export const Blockchain = {
  Ethereum: 'ethereum',
  Arbitrum: 'arbitrum',
  Polygon: 'polygon',
  Ton: 'ton'
}

const EVM_BLOCKCHAINS = [
  Blockchain.Ethereum,
  Blockchain.Arbitrum,
  Blockchain.Ton
]

export default class WdkManager {
  #accountAbstractionConfig
  #wallets
  #cache

  /**
   * @typedef {Object} Seeds
   * @property {string} ethereum - The ethereum's wallet seed phrase.
   * @property {string} arbitrum - The arbitrum's wallet seed phrase.
   * @property {string} polygon - The polygon's wallet seed phrase.
   * @property {string} ton - The ton's wallet seed phrase.
   */

  /**
   * @typedef {Object} AccountAbstractionConfig
   * @property {EvmAccountAbstractionConfig} ethereum - The account abstraction configuration for ethereum.
   * @property {EvmAccountAbstractionConfig} arbitrum - The account abstraction configuration for arbitrum.
   * @property {EvmAccountAbstractionConfig} polygon - The account abstraction configuration for polygon.
   * @property {TonAccountAbstractionConfig} ton - The account abstraction configuration for ton.
   */

  /**
   * @typedef {Object} EvmAccountAbstractionConfig
   * @property {string} blockchain - The blockchain’s identifier (e.g., "ethereum").
   * @property {string} rpcUrl - The url of the rpc provider.
   * @property {string} bundlerUrl - The url of the bundler service.
   * @property {string} paymasterUrl - The url of the paymaster service.
   * @property {string} paymasterAddress - The address of the paymaster smart contract.
   * @property {string} entryPointAddress - The address of the entry point smart contract.
   * @property {string} paymasterTokenOracleAddress - The address of the paymaster token oracle.
   * @property {number} paymasterPremiumOnGasCost - The percentage of the gas cost that the paymaster holds as a premium.
   * @property {number} minimumAllowanceToPaymaster - Minimum amount of allowance to give to the paymaster.
   * @property {number} transferMaxFee - Maximum fee amount for transfer operations.
   * @property {number} swapMaxFee - Maximum fee amount for swap operations.
   * @property {number} bridgeMaxFee - Maximum fee amount for bridge operations.
   * @property {Object} paymasterToken - The paymaster token configuration.
   * @property {string} paymasterToken.address - The address of the paymaster token.
   */

  /**
   * @typedef {Object} TonAccountAbstractionConfig
   * @property {string} tonApiUrl - The ton api's url.
   * @property {string} tonApiSecretKey - The api-key to use to authenticate on the ton api.
   * @property {string} tonCenterUrl - The ton center api's url.
   * @property {string} tonCenterSecretKey - The api-key to use to authenticate on the ton center api.
   * @property {Object} paymasterToken - The paymaster token configuration.
   * @property {string} paymasterToken.address - The address of the paymaster token.
   */

  /**
   * Creates a new wallet development kit manager.
   *
   * @param {string | Seeds} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase to use for
   *                                all blockchains, or an object mapping each blockchain to a different seed phrase.
   * @param {AccountAbstractionConfig} accountAbstractionConfig - The account abstraction configuration for each blockchain.
   */
  constructor (seed, accountAbstractionConfig) {
    this.#accountAbstractionConfig = accountAbstractionConfig

    this.#wallets = { }

    for (const blockchain of Object.values(Blockchain)) {
      const seedPhrase = typeof seed === 'string' ? seed : seed[blockchain]

      if (EVM_BLOCKCHAINS.includes(blockchain)) {
        this.#wallets[blockchain] = new WalletManagerEvm(seedPhrase, {
          rpcUrl: accountAbstractionConfig[blockchain]?.rpcUrl
        })
      }
      else if (blockchain === 'ton') {
        this.#wallets.ton = new WalletManagerTon(seedPhrase, {
          tonApiUrl: accountAbstractionConfig.ton?.tonApiUrl,
          tonApiSecretKey: accountAbstractionConfig.ton?.tonApiSecretKey
        })
      }
    }

    this.#cache = { }
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
   * const account = wdk.getAccount("ethereum", 1);
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {IWalletAccount} The account.
  */
  getAccount (blockchain, index = 0) {
    return this.#wallets[blockchain].getAccount(index)
  }

  /**
   * Returns the abstracted address of an account.
   *
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @returns {Promise<string>} The abstracted address.
   *
   * @example
   * // Get the abstracted address of the ethereum wallet's account at m/44'/60'/0'/0/3
   * const abstractedAddress = await wdk.getAbstractedAddress("ethereum", 3);
   */
  async getAbstractedAddress (blockchain, accountIndex) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.getAbstractedAddress()
  }

  /**
   * @typedef {Object} TransferOptions
   * @property {string} recipient - The address of the recipient.
   * @property {string} token - The address of the token to transfer.
   * @property {number} amount - The amount of tokens to transfer to the recipient (in base unit).
   */

  /**
   * @typedef {Object} TransferResult
   * @property {string} hash - The hash of the transfer operation.
   * @property {number} gasCost - The gas cost in paymaster token.
   */

  /**
   * Transfers a token to another address.
   *
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {TransferOptions} options - The transfer's options.
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
  async transfer (blockchain, accountIndex, options) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.transfer(options)
  }

  /**
   * Quotes the costs of a transfer operation.
   *
   * @see {@link transfer}
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {TransferOptions} options - The transfer's options.
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
   * console.log("Gas cost in paymaster token:", quote.gasCost);
   */
  async quoteTransfer (blockchain, accountIndex, options) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.quoteTransfer(options)
  }

  /**
   * @typedef {Object} SwapOptions
   * @property {string} tokenIn - The address of the token to sell.
   * @property {string} tokenOut - The address of the token to buy.
   * @property {number} [tokenInAmount] - The amount of input tokens to sell (in base unit).
   * @property {number} [tokenOutAmount] - The amount of output tokens to buy (in base unit).
   */

  /**
   * @typedef {Object} SwapResult
   * @property {string} hash - The hash of the swap operation.
   * @property {number} gasCost - The gas cost in paymaster token.
   * @property {number} tokenInAmount - The amount of input tokens sold.
   * @property {number} tokenOutAmount - The amount of output tokens bought.
   */

  /**
   * Swaps a pair of tokens.
   *
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {SwapOptions} options - The swap's options.
   * @returns {Promise<SwapResult>} The swap's result.
   */
  async swap (blockchain, accountIndex, options) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.swap(options)
  }

  /**
   * Quotes the costs of a swap operation.
   *
   * @see {@link swap}
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {SwapOptions} options - The swap's options.
   * @returns {Promise<Omit<SwapResult, 'hash'>>} The swap's quotes.
   */
  async quoteSwap (blockchain, accountIndex, options) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.quoteSwap(options)
  }

  /**
   * @typedef {Object} BridgeOptions
   * @property {string} targetChain - The identifier of the destination blockchain (e.g., "arbitrum").
   * @property {string} recipient - The address of the recipient.
   * @property {number} amount - The amount of usdt tokens to bridge to the destination chain (in base unit).
   */

  /**
   * @typedef {Object} BridgeResult
   * @property {string} hash - The hash of the bridge operation.
   * @property {number} gasCost - The gas cost in paymaster token.
   * @property {number} bridgeCost - The bridge cost in usdt tokens.
   */

  /**
   * Bridges usdt tokens to a different blockchain.
   *
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {BridgeOptions} options - The bridge's options.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge (blockchain, accountIndex, options) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.bridge(options)
  }

  /**
   * Quotes the costs of a bridge operation.
   *
   * @see {@link bridge}
   * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
   * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
   * @param {BridgeOptions} options - The bridge's options.
   * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
   */
  async quoteBridge (blockchain, accountIndex, options) {
    const manager = this.#getAccountAbstractionManager(blockchain, accountIndex)

    return await manager.quoteBridge(options)
  }

  #getAccountAbstractionManager (blockchain, accountIndex) {
    if (!Object.values(Blockchain).includes(blockchain)) {
      throw new Error(`Unsupported blockchain: ${blockchain}.`)
    }

    if (!this.#cache[[blockchain, accountIndex]]) {
      const account = this.getAccount(blockchain, accountIndex)
      const config = this.#accountAbstractionConfig[blockchain]
      const manager = new ACCOUNT_ABSTRACTION_MANAGERS[blockchain](account, config)

      this.#cache[[blockchain, accountIndex]] = manager
    }

    return this.#cache[[blockchain, accountIndex]]
  }
}
