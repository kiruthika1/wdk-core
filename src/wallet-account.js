/**
 * Interface for BIP-32 wallet accounts.
 * 
 * @interface
 */
export default function IWalletAccount() { }

/**
 * @typedef {Object} KeyPair
 * @property {string} publicKey - The public key.
 * @property {string} privateKey - The private key.
 */

/**
 * The derivation path's index of this account.
 *
 * @type {number}
 */
IWalletAccount.prototype.index = undefined

/**
 * The derivation path of this account (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
 *
 * @type {string}
 */
IWalletAccount.prototype.path = undefined

/**
 * The account's key pair.
 *
 * @type {KeyPair}
 */
IWalletAccount.prototype.keyPair = undefined

/**
 * Returns the account's address.
 *
 * @returns {Promise<string>} The account's address.
 */
IWalletAccount.prototype.getAddress = async function () {
  throw new Error('Not implemented.')
}

/**
 * Signs a message.
 *
 * @param {string} message - The message to sign.
 * @returns {Promise<string>} The message's signature.
 */
IWalletAccount.prototype.sign = async function (message) {
  throw new Error('Not implemented.')
}

/**
 * Verifies a message's signature.
 *
 * @param {string} message - The original message.
 * @param {string} signature - The signature to verify.
 * @returns {Promise<boolean>} True if the signature is valid.
 */
IWalletAccount.prototype.verify = async function (message, signature) {
  throw new Error('Not implemented.')
}

/**
 * Sends a transaction.
 *
 * @param {Object} tx - The transaction to send.
 * @param {string} tx.to - The transaction's recipient.
 * @param {number} tx.value - The amount of native tokens to send to the recipient (in base unit).
 * @returns {Promise<string>} The transaction's hash.
 */
IWalletAccount.prototype.sendTransaction = async function (tx) {
  throw new Error('Not implemented.')
}

/**
 * Quotes a transaction.
 *
 * @param {Object} tx - The transaction to quote.
 * @param {string} tx.to - The transaction's recipient.
 * @param {number} tx.value - The amount of native tokens to send to the recipient (in base unit).
 * @returns {Promise<number>} The transaction's fee (in base unit).
 */
IWalletAccount.prototype.quoteTransaction = async function (tx) {
  throw new Error('Not implemented.')
}

/**
 * Returns the account's native token balance.
 *
 * @returns {Promise<number>} The native token balance.
 */
IWalletAccount.prototype.getBalance = async function () {
  throw new Error('Not implemented.')
}

/**
 * Returns the account balance for a specific token.
 *
 * @param {string} tokenAddress - The smart contract address of the token.
 * @returns {Promise<number>} The token balance.
 */
IWalletAccount.prototype.getTokenBalance = async function (tokenAddress) {
  throw new Error('Not implemented.')
}
