/**
 * Enumeration for all available blockchains.
 */
export type Blockchain = string;
export namespace Blockchain {
    let Ethereum: string;
    let Arbitrum: string;
    let Polygon: string;
    let Ton: string;
    let Bitcoin: string;
    let Spark: string;
}
export default class WdkManager {
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
    static getRandomSeedPhrase(): string;
    /**
     * Checks if a seed phrase is valid.
     *
     * @param {string} seed - The seed phrase.
     * @returns {boolean} True if the seed phrase is valid.
     */
    static isValidSeedPhrase(seed: string): boolean;
    /**
     * Creates a new wallet development kit manager.
     *
     * @param {string | Seeds} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase to use for
     *                                all blockchains, or an object mapping each blockchain to a different seed phrase.
     * @param {WdkConfig} config - The configuration for each blockchain.
     */
    constructor(seed: string | Seeds, config: WdkConfig);
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
    getAccount(blockchain: Blockchain, index?: number): Promise<IWalletAccount>;
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
    getAbstractedAddress(blockchain: Blockchain, accountIndex: number): Promise<string>;
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
    transfer(blockchain: Blockchain, accountIndex: number, options: TransferOptions): Promise<TransferResult>;
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
    quoteTransfer(blockchain: Blockchain, accountIndex: number, options: TransferOptions): Promise<Omit<TransferResult, "hash">>;
    /**
     * Swaps a pair of tokens.
     *
     * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
     * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
     * @param {SwapOptions} options - The swap's options.
     * @returns {Promise<SwapResult>} The swap's result.
     */
    swap(blockchain: Blockchain, accountIndex: number, options: SwapOptions): Promise<SwapResult>;
    /**
     * Quotes the costs of a swap operation.
     *
     * @see {@link swap}
     * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
     * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
     * @param {SwapOptions} options - The swap's options.
     * @returns {Promise<Omit<SwapResult, 'hash'>>} The swap's quotes.
     */
    quoteSwap(blockchain: Blockchain, accountIndex: number, options: SwapOptions): Promise<Omit<SwapResult, "hash">>;
    /**
     * Bridges usdt tokens to a different blockchain.
     *
     * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
     * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
     * @param {BridgeOptions} options - The bridge's options.
     * @returns {Promise<BridgeResult>} The bridge's result.
     */
    bridge(blockchain: Blockchain, accountIndex: number, options: BridgeOptions): Promise<BridgeResult>;
    /**
     * Quotes the costs of a bridge operation.
     *
     * @see {@link bridge}
     * @param {Blockchain} blockchain - A blockchain identifier (e.g., "ethereum").
     * @param {number} accountIndex - The index of the account to use (see [BIP-44](https://en.bitcoin.it/wiki/BIP_0044)).
     * @param {BridgeOptions} options - The bridge's options.
     * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
     */
    quoteBridge(blockchain: Blockchain, accountIndex: number, options: BridgeOptions): Promise<Omit<BridgeResult, "hash">>;
    #private;
}
export type EvmWalletConfig = import("@wdk/wallet-evm").EvmWalletConfig;
export type EvmAccountAbstractionConfig = import("@wdk/account-abstraction-evm").EvmAccountAbstractionConfig;
export type TonWalletConfig = import("@wdk/wallet-ton").TonWalletConfig;
export type TonAccountAbstractionConfig = import("@wdk/account-abstraction-ton").TonAccountAbstractionConfig;
export type BtcWalletConfig = import("@wdk/wallet-btc").BtcWalletConfig;
export type SparkWalletConfig = import("@wdk/wallet-spark").SparkWalletConfig;
export type Seeds = {
    /**
     * - The ethereum's wallet seed phrase.
     */
    ethereum: string;
    /**
     * - The arbitrum's wallet seed phrase.
     */
    arbitrum: string;
    /**
     * - The polygon's wallet seed phrase.
     */
    polygon: string;
    /**
     * - The ton's wallet seed phrase.
     */
    ton: string;
    /**
     * - The bitcoin's wallet seed phrase.
     */
    bitcoin: string;
    /**
     * - The spark's wallet seed phrase.
     */
    spark: string;
};
export type WdkConfig = {
    /**
     * - The ethereum blockchain configuration.
     */
    ethereum: EvmWalletConfig | EvmAccountAbstractionConfig;
    /**
     * - The arbitrum blockchain configuration.
     */
    arbitrum: EvmWalletConfig | EvmAccountAbstractionConfig;
    /**
     * - The polygon blockchain configuration.
     */
    polygon: EvmWalletConfig | EvmAccountAbstractionConfig;
    /**
     * - The ton blockchain configuration.
     */
    ton: TonWalletConfig | TonAccountAbstractionConfig;
    /**
     * - The bitcoin blockchain configuration.
     */
    bitcoin: BtcWalletConfig;
    /**
     * - The spark blockchain configuration.
     */
    spark: SparkWalletConfig;
};
export type TransferOptions = {
    /**
     * - The address of the recipient.
     */
    recipient: string;
    /**
     * - The address of the token to transfer.
     */
    token: string;
    /**
     * - The amount of tokens to transfer to the recipient (in base unit).
     */
    amount: number;
};
export type TransferResult = {
    /**
     * - The hash of the transfer operation.
     */
    hash: string;
    /**
     * - The gas cost in paymaster token.
     */
    gasCost: number;
};
export type SwapOptions = {
    /**
     * - The address of the token to sell.
     */
    tokenIn: string;
    /**
     * - The address of the token to buy.
     */
    tokenOut: string;
    /**
     * - The amount of input tokens to sell (in base unit).
     */
    tokenInAmount?: number;
    /**
     * - The amount of output tokens to buy (in base unit).
     */
    tokenOutAmount?: number;
};
export type SwapResult = {
    /**
     * - The hash of the swap operation.
     */
    hash: string;
    /**
     * - The gas cost in paymaster token.
     */
    gasCost: number;
    /**
     * - The amount of input tokens sold.
     */
    tokenInAmount: number;
    /**
     * - The amount of output tokens bought.
     */
    tokenOutAmount: number;
};
export type BridgeOptions = {
    /**
     * - The identifier of the destination blockchain (e.g., "arbitrum").
     */
    targetChain: string;
    /**
     * - The address of the recipient.
     */
    recipient: string;
    /**
     * - The amount of usdt tokens to bridge to the destination chain (in base unit).
     */
    amount: number;
};
export type BridgeResult = {
    /**
     * - The hash of the bridge operation.
     */
    hash: string;
    /**
     * - The gas cost in paymaster token.
     */
    gasCost: number;
    /**
     * - The bridge cost in usdt tokens.
     */
    bridgeCost: number;
};
