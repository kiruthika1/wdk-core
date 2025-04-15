/**
 * Bridge operations for account abstraction functionality
 * @module BridgeOperations
 */

import CHAIN_INTERFACE_MAP from '../chainInterfaceMap';

const ALL_BRIDGE_MINIMUM_FEE = 1_000_000;

/**
 * Class providing bridge operations for account abstraction
 */
export class BridgeOperations {
  /**
   * Creates an instance of BridgeOperations
   * @param {Object} core - The core WDKAccountAbstractionEVM instance
   */
  constructor(core) {
    this.core = core;
  }

  /**
   * Executes a bridge operation between chains
   * @param {Object} opts - Bridge operation options
   * @param {string} opts.sourceChain - Source chain identifier
   * @param {string} opts.targetChain - Target chain identifier
   * @param {string} opts.recipient - Recipient address
   * @param {BigInt} opts.amount - Amount to bridge
   * @param {BigInt} [opts.nativeTokenDropAmount] - Amount of native token to drop
   * @param {Object} opts.safe4337Pack - Safe4337Pack instance
   * @param {boolean} [opts.simulate] - Whether to simulate the operation
   * @returns {Promise<Object>} Bridge operation result
   * @throws {Error} If bridge protocol is not supported or operation fails
   */
  async bridge(opts) {
    try {
      const bridge = this._getBridge(opts.sourceChain, opts.targetChain);

      switch (bridge.constructor.name) {
        case 'BridgeHelperUSDT0':
          return await this._bridgeWithUSDT0Helper(bridge, opts);

        case 'BridgeUSDT0':
        case 'BridgeStargate':
          return await this._bridgeDefault(bridge, opts);

        case 'BridgeAllbridge':
          return await this._bridgeWithAllBridge(bridge, opts);

        default:
          throw new Error('Bridge protocol not supported yet.');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a quote for a bridge operation
   * @param {Object} opts - Bridge quote options
   * @param {string} opts.sourceChain - Source chain identifier
   * @param {string} opts.targetChain - Target chain identifier
   * @param {string} opts.recipient - Recipient address
   * @param {BigInt} opts.amount - Amount to bridge
   * @param {BigInt} [opts.nativeTokenDropAmount] - Amount of native token to drop
   * @returns {Promise<Object>} Bridge operation quote
   */
  async quoteBridge(opts) {
    try {
      const result = await this.bridge({
        ...opts,
        simulate: true
      });

      return {
        ...result,
        success: true
      };
    } catch (error) {
      return {
        details: error.message,
        success: false
      };
    }
  }

  /**
   * Gets the bridge interface for the specified chains
   * @param {string} sourceChain - Source chain identifier
   * @param {string} targetChain - Target chain identifier
   * @returns {Object} The bridge interface
   * @throws {Error} If no bridge interface is found
   * @private
   */
  _getBridge(sourceChain, targetChain) {
    const mapping = CHAIN_INTERFACE_MAP.find(
      (i) => i.chain1 === sourceChain && i.chain2 === targetChain
    );

    if (!mapping) {
      throw new Error(
        `No bridge interface found for ${sourceChain} -> ${targetChain}.`
      );
    }

    const bridge = new mapping.interface({
      chain: sourceChain,
      providerUrl: this.core.providerUrl
    });

    return bridge;
  }

  /**
   * Executes a default bridge operation
   * @param {Object} bridge - The bridge interface
   * @param {Object} opts - Bridge operation options
   * @returns {Promise<Object>} Bridge operation result
   * @throws {Error} If operation fails or gas cost exceeds maximum
   * @private
   */
  async _bridgeDefault(bridge, opts) {
    const safe4337Pack = opts.safe4337Pack;
    const abstractedAddress = await safe4337Pack.protocolKit.getAddress();

    const nativeFee = await bridge.quoteSend(
      opts.targetChain,
      opts.recipient,
      opts.amount,
      opts.nativeTokenDropAmount
    );

    const bridgingTx = bridge.send(
      opts.targetChain,
      opts.recipient,
      opts.amount,
      nativeFee,
      abstractedAddress,
      opts.nativeTokenDropAmount
    );

    const { priceRoute, swapTx } = await this.core.swapOps._buildSwapTx({
      chainId: opts.sourceChain,
      srcToken: this.core.safeConfig.paymasterToken.address,
      destToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      amount: nativeFee,
      userAddress: abstractedAddress,
      side: 'BUY'
    });

    const maximumAllowanceTxs = await this.core.baseOps.prependApprove(
      [swapTx, bridgingTx],
      [
        {
          spender: this.core.safeConfig.paymasterAddress,
          amount: BigInt(Number.MAX_SAFE_INTEGER)
        },
        { spender: this.core.swapOps.PARA_SWAP_PROXY_ADDRESS, amount: BigInt(priceRoute.srcAmount) },
        { spender: bridgingTx.to, amount: BigInt(opts.amount) }
      ],
      this.core.safeConfig
    );

    const gasCostInPaymasterToken = await this.core.baseOps.estimateGasCostInPaymasterToken(
      safe4337Pack,
      maximumAllowanceTxs,
      this.core.providerUrl,
      this.core.safeConfig
    );

    if (opts.simulate) {
      return {
        hash: null,
        gasCost: Number(gasCostInPaymasterToken),
        bridgeCost: Number(priceRoute.srcAmount)
      };
    }

    if (gasCostInPaymasterToken >= BigInt(this.core.safeConfig.bridgeMaxFee)) {
      throw new Error('Exceeded maximum gas cost for bridge operation.');
    }

    const txs = await this.core.baseOps.prependApprove(
      [swapTx, bridgingTx],
      [
        {
          spender: this.core.safeConfig.paymasterAddress,
          amount: gasCostInPaymasterToken > BigInt(this.core.safeConfig.minimumPaymasterAllowance)
            ? gasCostInPaymasterToken
            : BigInt(this.core.safeConfig.minimumPaymasterAllowance)
        },
        { spender: this.core.swapOps.PARA_SWAP_PROXY_ADDRESS, amount: BigInt(priceRoute.srcAmount) },
        { spender: bridgingTx.to, amount: BigInt(opts.amount) }
      ],
      this.core.safeConfig
    );

    const hash = await this.core.baseOps.sendGaslessTransaction(safe4337Pack, txs);

    return {
      hash,
      gasCost: Number(gasCostInPaymasterToken),
      bridgeCost: Number(priceRoute.srcAmount)
    };
  }

  /**
   * Executes a bridge operation with USDT0 helper
   * @param {Object} bridge - The bridge interface
   * @param {Object} opts - Bridge operation options
   * @returns {Promise<Object>} Bridge operation result
   * @throws {Error} If operation fails or gas cost exceeds maximum
   * @private
   */
  async _bridgeWithUSDT0Helper(bridge, opts) {
    const safe4337Pack = opts.safe4337Pack;

    const fees = await bridge.quoteSend(
      opts.targetChain,
      opts.recipient,
      opts.amount,
      opts.nativeTokenDropAmount
    );

    const { nativeFee, feeQuoteInTokens } = fees;

    const bridgingTx = bridge.send(
      opts.targetChain,
      opts.recipient,
      opts.amount,
      nativeFee,
      opts.nativeTokenDropAmount
    );

    const maximumAllowanceTxs = await this.core.baseOps.prependApprove(
      [bridgingTx],
      [
        {
          spender: this.core.safeConfig.paymasterAddress,
          amount: BigInt(Number.MAX_SAFE_INTEGER)
        },
        {
          spender: bridgingTx.to,
          amount: BigInt(opts.amount) + BigInt(feeQuoteInTokens)
        }
      ],
      this.core.safeConfig
    );

    const gasCostInPaymasterToken = await this.core.baseOps.estimateGasCostInPaymasterToken(
      safe4337Pack,
      maximumAllowanceTxs,
      this.core.providerUrl,
      this.core.safeConfig
    );

    if (opts.simulate) {
      return {
        hash: null,
        gasCost: Number(gasCostInPaymasterToken),
        bridgeCost: Number(feeQuoteInTokens)
      };
    }

    if (gasCostInPaymasterToken >= BigInt(this.core.safeConfig.bridgeMaxFee)) {
      throw new Error('Exceeded maximum gas cost for bridge operation.');
    }

    const txs = await this.core.baseOps.prependApprove(
      [bridgingTx],
      [
        {
          spender: this.core.safeConfig.paymasterAddress,
          amount: gasCostInPaymasterToken > BigInt(this.core.safeConfig.minimumPaymasterAllowance)
            ? gasCostInPaymasterToken
            : BigInt(this.core.safeConfig.minimumPaymasterAllowance)
        },
        {
          spender: bridgingTx.to,
          amount: BigInt(opts.amount) + BigInt(feeQuoteInTokens)
        }
      ],
      this.core.safeConfig
    );

    const hash = await this.core.baseOps.sendGaslessTransaction(safe4337Pack, txs);

    return {
      hash,
      gasCost: Number(gasCostInPaymasterToken),
      bridgeCost: Number(feeQuoteInTokens)
    };
  }

  /**
   * Executes a bridge operation with Allbridge
   * @param {Object} bridge - The bridge interface
   * @param {Object} opts - Bridge operation options
   * @returns {Promise<Object>} Bridge operation result
   * @throws {Error} If operation fails or gas cost exceeds maximum
   * @private
   */
  async _bridgeWithAllBridge(bridge, opts) {
    const safe4337Pack = opts.safe4337Pack;

    const stablecoinFee = await bridge.getBridgingCostInTokens(opts.targetChain);

    const bridgingTx = await bridge.swapAndBridge(
      opts.targetChain,
      opts.recipient,
      opts.amount,
      Math.max(Number(stablecoinFee), ALL_BRIDGE_MINIMUM_FEE)
    );

    const maximumAllowanceTxs = await this.core.baseOps.prependApprove(
      [bridgingTx],
      [
        {
          spender: this.core.safeConfig.paymasterAddress,
          amount: BigInt(Number.MAX_SAFE_INTEGER)
        },
        {
          spender: bridgingTx.to,
          amount: BigInt(opts.amount)
        }
      ],
      this.core.safeConfig
    );

    const gasCostInPaymasterToken = await this.core.baseOps.estimateGasCostInPaymasterToken(
      safe4337Pack,
      maximumAllowanceTxs,
      this.core.providerUrl,
      this.core.safeConfig
    );

    if (opts.simulate) {
      return {
        hash: null,
        gasCost: Number(gasCostInPaymasterToken),
        bridgeCost: Number(stablecoinFee)
      };
    }

    if (gasCostInPaymasterToken >= BigInt(this.core.safeConfig.bridgeMaxFee)) {
      throw new Error('Exceeded maximum gas cost for bridge operation.');
    }

    const txs = await this.core.baseOps.prependApprove(
      [bridgingTx],
      [
        {
          spender: this.core.safeConfig.paymasterAddress,
          amount: gasCostInPaymasterToken > BigInt(this.core.safeConfig.minimumPaymasterAllowance)
            ? gasCostInPaymasterToken
            : BigInt(this.core.safeConfig.minimumPaymasterAllowance)
        },
        {
          spender: bridgingTx.to,
          amount: BigInt(opts.amount)
        }
      ],
      this.core.safeConfig
    );

    const hash = await this.core.baseOps.sendGaslessTransaction(safe4337Pack, txs);

    return {
      hash,
      gasCost: Number(gasCostInPaymasterToken),
      bridgeCost: Number(stablecoinFee)
    };
  }
} 