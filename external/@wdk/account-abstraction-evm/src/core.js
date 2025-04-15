/**
 * Account abstraction for EVM chains
 * @module WDKAccountAbstractionEVM
 */

import * as RelayKit from "../libs/relay-kit";
import { BridgeOperations } from "./bridge";
import { SwapOperations } from "./swap";
import { BaseOperations } from "./base";
import { SendOperations } from "./send";

/**
 * Class representing account abstraction functionality for EVM chains
 */
export class WDKAccountAbstractionEVM {
  /**
   * Creates an instance of WDKAccountAbstractionEVM
   * @param {string} providerUrl - The URL of the Ethereum provider
   * @param {Object} safeConfig - Configuration for Safe wallet
   * @param {string} safeConfig.bundlerUrl - URL of the bundler service
   * @param {string} safeConfig.paymasterUrl - URL of the paymaster service
   * @param {string} safeConfig.paymasterAddress - Address of the paymaster contract
   * @param {Object} safeConfig.paymasterToken - Token configuration for paymaster
   * @param {string} safeConfig.paymasterToken.address - Address of the token used for paymaster
   */
  constructor(providerUrl, safeConfig) {
    this.providerUrl = providerUrl;
    this.safeConfig = safeConfig;

    // Initialize operation modules
    this.bridgeOps = new BridgeOperations(this);
    this.swapOps = new SwapOperations(this);
    this.baseOps = new BaseOperations(this);
    this.sendOps = new SendOperations(this);
  }

  /**
   * Initializes a Safe4337Pack instance for the given wallet
   * @param {Object} wallet - The wallet object
   * @param {string} wallet.privateKey - Private key of the wallet
   * @param {string} wallet.address - Address of the wallet
   * @returns {Promise<Object>} The initialized Safe4337Pack instance
   * @throws {Error} If wallet private key is invalid or initialization fails
   */
  async getSafe4337Pack(wallet) {
    if (!wallet.privateKey) {
      throw new Error("Invalid wallet private key");
    }

    try {
      return await RelayKit.Safe4337Pack.init({
        provider: this.providerUrl,
        signer: wallet.privateKey,
        bundlerUrl: this.safeConfig.bundlerUrl,
        options: {
          owners: [wallet.address],
          threshold: 1,
          saltNonce: '0x69b348339eea4ed93f9d11931c3b894c8f9d8c7663a053024b11cb7eb4e5a1f6'
        },
        paymasterOptions: {
          paymasterUrl: this.safeConfig.paymasterUrl,
          paymasterAddress: this.safeConfig.paymasterAddress,
          paymasterTokenAddress: this.safeConfig.paymasterToken.address,
          skipApproveTransaction: true
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets the abstracted address from a Safe4337Pack instance
   * @param {Object} safe4337Pack - The Safe4337Pack instance
   * @returns {Promise<string>} The abstracted address
   */
  async getAbstractedAddress(safe4337Pack) {
    const address = await safe4337Pack.protocolKit.getAddress();
    return address;
  }

  /**
   * Executes a bridge operation
   * @param {Object} opts - Bridge operation options
   * @returns {Promise<Object>} Result of the bridge operation
   */
  async bridge(opts) {
    return this.bridgeOps.bridge(opts);
  }

  /**
   * Gets a quote for a bridge operation
   * @param {Object} opts - Bridge quote options
   * @returns {Promise<Object>} Bridge operation quote
   */
  async quoteBridge(opts) {
    return this.bridgeOps.quoteBridge(opts);
  }

  /**
   * Executes a swap operation
   * @param {Object} opts - Swap operation options
   * @returns {Promise<Object>} Result of the swap operation
   */
  async swap(opts) {
    return this.swapOps.swap(opts);
  }

  /**
   * Gets a quote for a swap operation
   * @param {Object} opts - Swap quote options
   * @returns {Promise<Object>} Swap operation quote
   */
  async quoteSwap(opts) {
    return this.swapOps.quoteSwap(opts);
  }

  /**
   * Executes a send transaction operation
   * @param {Object} opts - Send operation options
   * @returns {Promise<Object>} Result of the send operation
   */
  async send(opts) {
    return this.sendOps.send(opts);
  }

  /**
   * Gets a quote for a send transaction operation
   * @param {Object} opts - Send quote options
   * @returns {Promise<Object>} Send operation quote
   */
  async quoteSend(opts) {
    return this.sendOps.quoteSend(opts);
  }
} 