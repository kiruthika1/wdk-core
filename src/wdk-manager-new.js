import WdkWallet from '@wdk/wallet'

/**
 *  @type {import('@wdk/wallet').default as WdkWallet} WdkWallet */

/** @type {import("@wdk/wallet").IWalletAccount} */
/**
 * @template {typeof WdkWallet} W
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
 * console.log(await account.getAddress())
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
 * const wdk = new WdkManager('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
 *
 * // Using Uint8Array
 * const seedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
 * const wdk = new WdkManager(seedBytes)
 */
  constructor (seed) {
    if (!WdkManager.isValidSeedPhrase(seed)) {
      throw new Error('Invalid seed phrase')
    }

    /** @private
     * @type {String | Uint8Array}
     * @description The wallet's BIP-39 seed phrase.
     * @example
     * const wdk = new WdkManager('...')
     * console.log(wdk._seed)
     * TODO: offuscate the seed with cryptography
     */
    this._seed = seed
    /** @private
     * @type {Map<string, WdkWallet>}
     * @description A map of registered wallet instances keyed by blockchain name.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumConfig)
     * // Now wdk._wallets.get('ethereum') returns a WdkWallet instance
     */
    this._wallets = Object.freeze(new Map())
  }

  /**
   * Static Method to create a new random seed phrase.
   *
   * @returns {string} The seed phrase.
   *
   * @example
   * const seed = WdkManager.getRandomSeedPhrase()
   * console.log(seed)
   */
  static getRandomSeedPhrase () {
    return WdkWallet.getRandomSeedPhrase()
  }

  /**
   * Static Method to check if a seed phrase is valid.
   *
   * @param {string} seed - The seed phrase.
   * @returns {boolean} True if the seed phrase is valid.
   */

  /**
   * Static Method to check if a seed phrase is valid.
   *
   * @param {string} seed - The seed phrase.
   * @returns {boolean} True if the seed phrase is valid.
   */
  static isValidSeedPhrase (seed) {
    console.log('seed inside isValidSeedPhrase', seed)
    return WdkWallet.isValidSeedPhrase(seed) || this.isValidSeedBytes(seed)
  }

  /**
   * Static Method to check if a seed bytes is valid.
   *
   * @param {Uint8Array} seedBytes - The seed bytes.
   * @returns {boolean} True if the seed bytes is valid.
   */
  static isValidSeedBytes (seedBytes) {
    return seedBytes instanceof Uint8Array &&
         seedBytes.length >= 16 &&
         seedBytes.length <= 32
  }

  /**
 * Registers a new wallet to the wdk manager.
 *
 * @description Registers a wallet class for a specific blockchain. The wallet's account will be instantiated
 * when first accessed via getAccount() or getAccountByPath(). This method supports method chaining.
 *
 * @param {string} blockchain - The name of the blockchain the wallet must be bound to (e.g., "ethereum", "spark").
 * @param {W} WdkWallet - The wallet manager class constructor that extends WdkWallet.
 * @param {ConstructorParameters<W>[1]} config - The configuration object passed to the wallet constructor.
 * @returns {WdkManager} Returns this instance for method chaining.
 * @throws {Error} If blockchain is not a string or wallet is not a class constructor.
 *
 * @example
 * import WdkManager from '@wdk/core'
 * import WalletManagerEvm from '@wdk/wallet-evm'
 * import WalletManagerSpark from '@wdk/wallet-spark'
 *
 * const wdk = new WdkManager('...')
 * wdk.registerWallet('ethereum', WalletManagerEvm, { rpcUrl: 'https://yourURL' })
 *    .registerWallet('spark', WalletManagerSpark, { network: 'REGTEST' })
 */
  registerWallet (blockchain, WalletClass, config) {
    if (typeof blockchain !== 'string') {
      throw new Error('Blockchain parameter must be a string')
    }

    if (typeof WalletClass !== 'function') {
      throw new Error('WalletClass parameter must be a class constructor')
    }

    // Check if WalletClass extends WdkWallet
    if (!(WalletClass.prototype instanceof WdkWallet)) {
      throw new Error('WalletClass must extend WdkWallet')
    }

    /**  Create a new wallet instance
     * @type {WdkWallet}
     * @description The wallet instance.
     * @example
     * const wdk = new WdkManager('...')
     * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumWalletConfig)
     */
    const walletInstance = new WalletClass(this._seed, config)

    /** Store the wallet instance
     * @type {Map<string, WdkWallet>}
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
     * @type {WdkWallet}
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
     * @type {WdkWallet}
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
     * @type {WdkWallet}
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
export { WdkWallet }
