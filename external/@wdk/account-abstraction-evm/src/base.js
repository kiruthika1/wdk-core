/**
 * Base operations for account abstraction functionality
 * @module BaseOperations
 */

import { Contract, JsonRpcProvider } from "ethers";

/**
 * Class providing base operations for account abstraction
 */
export class BaseOperations {
  /**
   * Creates an instance of BaseOperations
   * @param {Object} core - The core WDKAccountAbstractionEVM instance
   */
  constructor(core) {
    this.core = core;
  }

  /**
   * Gets the receipt for a gasless transaction
   * @param {Object} safe4337Pack - The Safe4337Pack instance
   * @param {string} id - The transaction ID
   * @returns {Promise<Object>} The transaction receipt
   */
  async getGaslessTransactionReceipt(safe4337Pack, id) {
    const userOperationReceipt = await safe4337Pack.getUserOperationReceipt(id);
    return userOperationReceipt;
  }

  /**
   * Prepends approve transactions to a list of transactions
   * @param {Array<Object>} txs - The list of transactions
   * @param {Array<Object>} approves - The list of approve operations
   * @param {Object} safeConfig - Safe configuration
   * @param {string} [safeConfig.paymasterToken.address] - Address of the paymaster token
   * @returns {Array<Object>} The combined list of transactions
   */
  async prependApprove(txs, approves, safeConfig) {
    const transactions = [];

    for (const { spender, amount, tokenAddress } of approves) {
      const address = tokenAddress || safeConfig.paymasterToken.address;
      const tokenContract = new Contract(
        address,
        ['function approve(address,uint256)']
      );

      transactions.push({
        to: address,
        value: 0n,
        data: tokenContract.interface.encodeFunctionData('approve', [spender, amount])
      });
    }

    transactions.push(...txs);
    return transactions;
  }

  /**
   * Estimates the gas cost in paymaster token
   * @param {Object} safe4337Pack - The Safe4337Pack instance
   * @param {Array<Object>} txs - The list of transactions
   * @param {string} providerUrl - The provider URL
   * @param {Object} safeConfig - Safe configuration
   * @param {string} safeConfig.paymasterTokenOracleAddress - Address of the paymaster token oracle
   * @param {number} safeConfig.maximumPremiumOnGasCost - Maximum premium on gas cost
   * @returns {Promise<BigInt>} The estimated gas cost in paymaster token
   * @throws {Error} If estimation fails
   */
  async estimateGasCostInPaymasterToken(safe4337Pack, txs, providerUrl, safeConfig) {
    try {
      const gasCost = await this.estimateGaslessTransactionGasCost(safe4337Pack, txs);

      const oracle = new Contract(
        safeConfig.paymasterTokenOracleAddress,
        ['function latestAnswer() view returns (int256)'],
        new JsonRpcProvider(providerUrl)
      );

      const paymasterTokenPrice = await oracle.latestAnswer();
      const gasCostInPaymasterToken = (BigInt(gasCost) * BigInt(paymasterTokenPrice) * BigInt(safeConfig.maximumPremiumOnGasCost)) / BigInt(10 ** (18 + 8));

      return gasCostInPaymasterToken;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Estimates the gas cost for a gasless transaction
   * @param {Object} safe4337Pack - The Safe4337Pack instance
   * @param {Array<Object>} txs - The list of transactions
   * @returns {Promise<BigInt>} The estimated gas cost
   * @throws {Error} If estimation fails or there are insufficient funds
   */
  async estimateGaslessTransactionGasCost(safe4337Pack, txs) {
    try {
      let safeOperation;
      try {
        safeOperation = await safe4337Pack.createTransaction({
          transactions: txs
        });
      } catch (error) {
        if (error.message.includes('AA50')) {
          throw new Error(
            'Simulation failed: not enough funds in the safe account to repay the paymaster.'
          );
        }
        throw error;
      }

      const {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas
      } = safeOperation.userOperation;

      return (callGasLimit + verificationGasLimit + preVerificationGas) * maxFeePerGas;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sends a gasless transaction
   * @param {Object} safe4337Pack - The Safe4337Pack instance
   * @param {Array<Object>} txs - The list of transactions
   * @returns {Promise<Object>} The transaction result
   * @throws {Error} If transaction fails or there are insufficient funds
   */
  async sendGaslessTransaction(safe4337Pack, txs) {
    const twoMinutesFromNow = Math.floor(Date.now() / 1000) + 2 * 60;

    let safeOperation;
    try {
      safeOperation = await safe4337Pack.createTransaction(
        {
          transactions: txs
        },
        {
          validUntil: twoMinutesFromNow
        }
      );
    } catch (err) {
      if (err.message.includes('AA50')) {
        throw new Error(
          'Not enough funds on the safe account to repay the paymaster.'
        );
      }
      throw err;
    }

    const signedSafeOperation = await safe4337Pack.signSafeOperation(
      safeOperation
    );

    return await safe4337Pack.executeTransaction({
      executable: signedSafeOperation
    });
  }
} 