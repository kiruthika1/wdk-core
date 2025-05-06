/**
 * Interface for BIP-32 wallet accounts.
 *
 * @interface
 */
export default function IWalletAccount(): void;
export default class IWalletAccount {
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
    index: number;
    /**
     * The derivation path of this account (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
     *
     * @type {string}
     */
    path: string;
    /**
     * The account's key pair.
     *
     * @type {KeyPair}
     */
    keyPair: KeyPair;
    /**
     * Returns the account's address.
     *
     * @returns {Promise<string>} The account's address.
     */
    getAddress(): Promise<string>;
    /**
     * Signs a message.
     *
     * @param {string} message - The message to sign.
     * @returns {Promise<string>} The message's signature.
     */
    sign(message: string): Promise<string>;
    /**
     * Verifies a message's signature.
     *
     * @param {string} message - The original message.
     * @param {string} signature - The signature to verify.
     * @returns {Promise<boolean>} True if the signature is valid.
     */
    verify(message: string, signature: string): Promise<boolean>;
    /**
     * Sends a transaction.
     *
     * @param {Object} tx - The transaction to send.
     * @param {string} tx.to - The transaction's recipient.
     * @param {number} tx.value - The amount of native tokens to send to the recipient (in base unit).
     * @returns {Promise<string>} The transaction's hash.
     */
    sendTransaction(tx: {
        to: string;
        value: number;
    }): Promise<string>;
    /**
     * Returns the account's native token balance.
     *
     * @returns {Promise<number>} The native token balance.
     */
    getBalance(): Promise<number>;
    /**
     * Returns the account balance for a specific token.
     *
     * @param {string} tokenAddress - The smart contract address of the token.
     * @returns {Promise<number>} The token balance.
     */
    getTokenBalance(tokenAddress: string): Promise<number>;
}
export type KeyPair = {
    /**
     * - The public key.
     */
    publicKey: string;
    /**
     * - The private key.
     */
    privateKey: string;
};
