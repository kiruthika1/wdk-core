/**
 * Swap operations for account abstraction functionality
 * @module SwapOperations
 */

import { constructSimpleSDK } from "@paraswap/sdk";

/**
 * Class providing swap operations for account abstraction
 */
export class SwapOperations {
  /**
   * Creates an instance of SwapOperations
   * @param {Object} core - The core WDKAccountAbstractionEVM instance
   */
  constructor(core) {
    this.core = core;
    this.PARA_SWAP_PROXY_ADDRESS = '0x216b4b4ba9f3e719726886d34a177484278bfcae';
    this.chainIds = {
      'ethereum': 1,
      'arbitrum': 42161,
      'tron': 195,
      'ton': 32520,
      'polygon': 137,
      'avalanche': 43114,
      'solana': 101,
      'base': 8453,
      'optimism': 10,
      'gnosis': 100,
      'linea': 59144
    };
  }

  /**
   * Executes a token swap operation
   * @param {Object} opts - Swap operation options
   * @param {string} opts.tokenIn - Input token address
   * @param {string} opts.tokenOut - Output token address
   * @param {BigInt} [opts.tokenInAmount] - Input token amount
   * @param {BigInt} [opts.tokenOutAmount] - Output token amount
   * @param {Object} opts.safe4337Pack - Safe4337Pack instance
   * @param {boolean} [opts.simulate] - Whether to simulate the operation
   * @returns {Promise<Object>} Swap operation result
   * @throws {Error} If operation fails, tokens are equal, or gas cost exceeds maximum
   */
  async swap(opts) {
    const safe4337Pack = opts.safe4337Pack;

    if (opts.tokenIn === opts.tokenOut) {
      throw new Error("'tokenIn' and 'tokenOut' cannot be equal.");
    }

    if (!opts.tokenInAmount && !opts.tokenOutAmount) {
      throw new Error(
        "A valid 'tokenInAmount' or 'tokenOutAmount' must be passed."
      );
    }

    if (opts.tokenInAmount && opts.tokenOutAmount) {
      throw new Error(
        "Cannot use both 'tokenInAmount' and 'tokenOutAmount' arguments."
      );
    }

    try {
      const abstractedAddress = await safe4337Pack.protocolKit.getAddress();
      const side = opts.tokenInAmount ? 'SELL' : 'BUY';
      const amount = opts.tokenInAmount || opts.tokenOutAmount;

      const { priceRoute, swapTx } = await this._buildSwapTx({
        srcToken: opts.tokenIn,
        destToken: opts.tokenOut,
        userAddress: abstractedAddress,
        amount: amount,
        side
      });

      const maximumAllowanceTxs = await this.core.baseOps.prependApprove(
        [swapTx],
        [
          {
            spender: this.core.safeConfig.paymasterAddress,
            amount: BigInt(Number.MAX_SAFE_INTEGER)
          },
          {
            spender: this.core.PARA_SWAP_PROXY_ADDRESS,
            amount: BigInt(priceRoute.srcAmount),
            tokenAddress: opts.tokenIn
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
          tokenInAmount: priceRoute.srcAmount,
          tokenOutAmount: priceRoute.destAmount
        };
      }

      if (gasCostInPaymasterToken >= BigInt(this.core.safeConfig.swapMaxFee)) {
        throw new Error('Exceeded maximum gas cost for swap operation.');
      }

      const txs = await this.core.baseOps.prependApprove(
        [swapTx],
        [
          {
            spender: this.core.safeConfig.paymasterAddress,
            amount: gasCostInPaymasterToken > BigInt(this.core.safeConfig.minimumPaymasterAllowance)
              ? BigInt(gasCostInPaymasterToken)
              : BigInt(this.core.safeConfig.minimumPaymasterAllowance)
          },
          {
            spender: this.core.PARA_SWAP_PROXY_ADDRESS,
            amount: BigInt(priceRoute.srcAmount),
            tokenAddress: opts.tokenIn
          }
        ],
        this.core.safeConfig
      );

      const hash = await this.core.baseOps.sendGaslessTransaction(safe4337Pack, txs);

      return {
        hash,
        gasCost: Number(gasCostInPaymasterToken),
        tokenInAmount: priceRoute.srcAmount,
        tokenOutAmount: priceRoute.destAmount
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a quote for a swap operation
   * @param {Object} opts - Swap quote options
   * @param {string} opts.tokenIn - Input token address
   * @param {string} opts.tokenOut - Output token address
   * @param {BigInt} [opts.tokenInAmount] - Input token amount
   * @param {BigInt} [opts.tokenOutAmount] - Output token amount
   * @returns {Promise<Object>} Swap operation quote
   */
  async quoteSwap(opts) {
    try {
      const result = await this.swap({
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
   * Builds a swap transaction
   * @param {Object} opts - Swap transaction options
   * @param {string} opts.srcToken - Source token address
   * @param {string} opts.destToken - Destination token address
   * @param {string} opts.userAddress - User address
   * @param {BigInt} opts.amount - Swap amount
   * @param {string} opts.side - Swap side ('BUY' or 'SELL')
   * @returns {Promise<Object>} Swap transaction details
   * @private
   */
  async _buildSwapTx(opts) {
    const _paraswap = constructSimpleSDK({
      chainId: this.chainIds[opts.chainId],
      version: '5',
      fetch
    });

    const priceRoute = await _paraswap.swap.getRate(opts);

    const input = {
      srcToken: priceRoute.srcToken,
      destToken: priceRoute.destToken,
      srcAmount: priceRoute.srcAmount,
      destAmount: priceRoute.destAmount,
      userAddress: opts.userAddress,
      partner: 'wdk',
      priceRoute
    };

    const swapTx = await _paraswap.swap.buildTx(input, {
      ignoreChecks: true
    });

    return { priceRoute, swapTx };
  }
} 