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
import WalletManager from '@wdk/wallet'

/**
 *  @type {import('@wdk/wallet').default as WalletManager} WalletManager */

/** @type {import("@wdk/wallet").IWalletAccount} */
/**
 * @template {typeof WalletManager} W
 * @typedef {ConstructorParameters<W>} WalletConstructorParameters
 */

/**
 * @import {FeeRates} from "@wdk/wallet"
*/

/**
 * Wallet Development Kit Manager
 *
 * A flexible manager that can register and manage multiple wallet instances
 * for different blockchains dynamically.
 *
  * @example
 * import WdkManager from '@wdk/core'
 * import WalletManagerEvm from '@wdk/wallet-evm'
 *
 * const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
 * wdk.registerWallet('ethereum', WalletManagerEvm, { rpcUrl: 'https://yourURL' })
 * const account = await wdk.getAccount('ethereum', 0)
 * // Output: "Account m/44'/60'/0'/0/0: 0x123..."
 * console.log("Account m/44'/60'/0'/0/0:", await account.getAddress())
 */
class WdkManager {
  /**
 * Creates a new wallet development kit manager.
 *
 * @description Initializes a new WdkManager instance with a BIP-39 seed phrase that will be used
 * to derive wallet accounts across all registered blockchains.
 *
 * @param {string | Uint8Array} seed - The wallet's BIP-39 seed phrase used for deriving all wallet accounts.
 * @throws {Error} If the seed parameter is invalid or missing.
 *
 * @example
 * // Using string mnemonic
 * const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
 *
 * // Using Uint8Array
 * const seedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
 * const wdk = new WdkManager(seedBytes)
 */
  constructor (seed) {
    if (!WdkManager.isValidSeed(seed)) {
      throw new Error('Invalid seed phrase')
    }

    /**
     * The wallet's bip-39 seed phrase.

     * @todo Offuscate the seed with cryptography,
     * @private
     * @type {String | Uint8Array}
     */
    this._seed = seed
    /** @private
     * @type {Map<string, WalletManager>}
     * @description A map of registered wallet instances keyed by blockchain name.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumConfig)
     * // Now wdk._wallets.get('ethereum') returns a WalletManager instance
     */
    this._wallets = new Map()
  }

  /**
   * Returns a random [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   *
   * @returns {string} The seed phrase.
   *
   * @example
   * const seed = WdkManager.getRandomSeedPhrase()
   * console.log(seed)
   */
  static getRandomSeedPhrase () {
    return WalletManager.getRandomSeedPhrase()
  }

  /**
   * Checks if a seed is valid.
   *
   * @param {string | Uint8Array} seed - The seed.
   * @returns {boolean} True if the seed is valid.
   * @param {string | Uint8Array} seed - The seed.
   * @returns {boolean} True if the seed is valid.
   */
  static isValidSeed (seed) {
    if (seed instanceof Uint8Array) {
      return seed.length >= 16 && seed.length <= 64
    }

    return WalletManager.isValidSeedPhrase(seed)
  }

  /**
   * Registers a new wallet to the wdk manager.
   *
   * @param {string} blockchain - The name of the blockchain the wallet must be bound to. Can be any string (e.g., "ethereum").
   * @param {W} WalletManager - The wallet manager class.
   * @param {ConstructorParameters<W>[1]} config - The configuration object.
   * @template {typeof WalletManager} W
   * @returns {WdkManager} The wdk manager.
   *
   * @example
   * import WalletManagerEvm from '@wdk/wallet-evm'
   *
   * wdk.registerWallet('ethereum', WalletManagerEvm, { rpcUrl: 'https://your-provider-url.com' })
   */
  registerWallet (blockchain, _WalletManager, config) {
    if (typeof blockchain !== 'string') {
      throw new Error('Blockchain parameter must be a string')
    }

    if (typeof _WalletManager !== 'function') {
      throw new Error('WalletManager parameter must be a class constructor')
    }

    // Check if WalletManager extends WalletManager
    if (!(_WalletManager.prototype instanceof WalletManager)) {
      throw new Error('WalletManager must extend WdkWallet')
    }

    /**  Create a new wallet instance
     * @type {WalletManager}
     * @description The wallet instance.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumWalletConfig)
     */
    const walletInstance = new _WalletManager(this._seed, config)

    /** Store the wallet instance
     * @type {Map<string, WalletManager>}
     * @description The wallet instance.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumWalletConfig)
     */
    this._wallets.set(blockchain, walletInstance)
    return this
  }

  /**
   * Get a wallet account for the specified blockchain.
   *
   * @param {string} blockchain - The name of the blockchain.
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<IWalletAccount>} The wallet account.
   *
   * @throws {Error} If no wallet is registered for the specified blockchain.
   */
  async getAccount (blockchain, index = 0) {
    if (!this._wallets.has(blockchain)) {
      throw new Error(`No wallet registered for blockchain: ${blockchain}`)
    }

    /** Get the wallet instance
     * @type {WalletManager}
     * @description The wallet instance.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumWalletConfig)
     */
    const wallet = this._wallets.get(blockchain)

    return await wallet.getAccount(index)
  }

  /**
   * Get a wallet account for the specified blockchain by path.
   *
   * @param {string} blockchain - The name of the blockchain.
   * @param {string} path - The path of the account to get.
   * @returns {Promise<IWalletAccount>} The wallet account.
   *
   * @throws {Error} If no wallet is registered for the specified blockchain.
   */
  async getAccountByPath (blockchain, path) {
    if (!this._wallets.has(blockchain)) {
      throw new Error(`No wallet registered for blockchain: ${blockchain}`)
    }

    /** Get the wallet instance
     * @type {WalletManager}
     * @description The wallet instance.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumWalletConfig)
     */
    const wallet = this._wallets.get(blockchain)

    return await wallet.getAccountByPath(path)
  }

  /**
   * Get the wallet FeeRates for the specified blockchain.
   *
   * @param {string} blockchain - The name of the blockchain.
   * @returns {Promise<FeeRates>} The fee rates.
   */
  /**
   * Get the wallet FeeRates for the specified blockchain.
   *
   * @param {string} blockchain - The name of the blockchain.
   * @returns {Promise<FeeRates>} The fee rates.
   */
  async getFeeRates (blockchain) {
    if (!this._wallets.has(blockchain)) {
      throw new Error(`No wallet registered for blockchain: ${blockchain}`)
    }

    /** Get the wallet instance
     * @type {WalletManager}
     * @description The wallet instance.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumWalletConfig)
     * const feeRates = await wdk.getFeeRates('ethereum')
     * console.log(feeRates)
     */
    const wallet = this._wallets.get(blockchain)

    return await wallet.getFeeRates()
  }

  /**
   * Disposes all wallet instances, erasing their private keys from memory.
   */
  async dispose () {
    for (const [, walletInstance] of this._wallets) {
      if (typeof walletInstance.dispose === 'function') {
        walletInstance.dispose()
      }
    }
  }
}

export default WdkManager
export { WalletManager }
