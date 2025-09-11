export default WdkManager;
export { WalletManager };
export type IWalletAccountWithProtocols =
  | IWalletAccount
  | ISwapProtocol
  | IBridgeProtocol
  | ILendingProtocol;
/**
 *  @type {import('@wdk/wallet').default as WalletManager} WalletManager
 * @type {import("@wdk/wallet").IWalletAccount} IWalletAccount
 * @type {import("@wdk/wallet/protocols").ISwapProtocol} ISwapProtocol
 * @type {import("@wdk/wallet/protocols").IBridgeProtocol} IBridgeProtocol
 * @type {import("@wdk/wallet/protocols").ILendingProtocol} ILendingProtocol
 */
/**
 *
 */
/**
 * @typedef {IWalletAccount | ISwapProtocol | IBridgeProtocol | ILendingProtocol} IWalletAccountWithProtocols
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
declare class WdkManager {
  /**
   * Returns a random [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   *
   * @returns {string} The seed phrase.
   *
   * @example
   * const seed = WdkManager.getRandomSeedPhrase()
   * console.log(seed)
   */
  static getRandomSeedPhrase(): string;
  /**
   * Checks if a seed is valid.
   *
   * @param {string | Uint8Array} seed - The seed.
   * @returns {boolean} True if the seed is valid.
   * @param {string | Uint8Array} seed - The seed.
   * @returns {boolean} True if the seed is valid.
   */
  static isValidSeed(seed: string | Uint8Array): boolean;
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
  constructor(seed: string | Uint8Array);
  /**
     * The wallet's bip-39 seed phrase.

     * @todo Offuscate the seed with cryptography,
     * @private
     * @type {String | Uint8Array}
     */
  private _seed;
  /**
   * @private
   * @type {Map<string, WalletManager>}
   * @description A map of registered wallet instances keyed by blockchain name.
   * @example
   * const wdk = new WdkManager('...')
   * wdk.registerWallet('ethereum', WalletManagerEvm, ethereumConfig)
   * // Now wdk._wallets.get('ethereum') returns a WalletManager instance
   */
  private _wallets;
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
  registerWallet<W extends typeof WalletManager>(
    blockchain: string,
    _WalletManager: any,
    config: ConstructorParameters<W>[1]
  ): WdkManager;
  /**
   * Get a wallet account for the specified blockchain.
   *
   * @param {string} blockchain - The name of the blockchain.
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<IWalletAccount>} The wallet account.
   *
   * @throws {Error} If no wallet is registered for the specified blockchain.
   */
  getAccount(blockchain: string, index?: number): Promise<IWalletAccount>;
  /**
   * Get a wallet account for the specified blockchain by path.
   *
   * @param {string} blockchain - The name of the blockchain.
   * @param {string} path - The path of the account to get.
   * @returns {Promise<IWalletAccount>} The wallet account.
   *
   * @throws {Error} If no wallet is registered for the specified blockchain.
   */
  getAccountByPath(blockchain: string, path: string): Promise<IWalletAccount>;
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
  getFeeRates(blockchain: string): Promise<FeeRates>;
  /**
   * Disposes all wallet instances, erasing their private keys from memory.
   */
  dispose(): Promise<void>;
}
import WalletManager from "@wdk/wallet";
import type { FeeRates } from "@wdk/wallet";
