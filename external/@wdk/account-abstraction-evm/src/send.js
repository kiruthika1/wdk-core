/**
 * Send operations for account abstraction functionality
 * @module SendOperations
 */

import { Contract } from "ethers";

/**
 * Class providing send operations for account abstraction
 */
export class SendOperations {
    /**
     * Creates an instance of SendOperations
     * @param {Object} core - The core WDKAccountAbstractionEVM instance
     */
    constructor(core) {
        this.core = core;
    }

    /**
     * Executes a token transfer operation
     * @param {Object} opts - Send operation options
     * @param {string} opts.token - Token contract address
     * @param {string} opts.recipient - recipient address
     * @param {BigInt} opts.amount - Amount to send
     * @param {Object} opts.safe4337Pack - Safe4337Pack instance
     * @param {boolean} [opts.simulate] - Whether to simulate the operation
     * @returns {Promise<Object>} Send operation result
     * @throws {Error} If operation fails or gas cost exceeds maximum
     */
    async send(opts) {
        const safe4337Pack = opts.safe4337Pack;

        try {
            const tokenContract = new Contract(
                opts.token,
                ['function transfer(address,uint256)']
            );

            const transferTx = {
                to: opts.token,
                value: 0n,
                data: tokenContract.interface.encodeFunctionData('transfer', [opts.recipient, opts.amount])
            };

            const maximumAllowanceTxs = await this.core.baseOps.prependApprove(
                [transferTx],
                [
                    {
                        spender: this.core.safeConfig.paymasterAddress,
                        amount: BigInt(Number.MAX_SAFE_INTEGER)
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
                    gasCost: Number(gasCostInPaymasterToken)
                };
            }

            if (gasCostInPaymasterToken >= BigInt(this.core.safeConfig.sendMaxFee)) {
                throw new Error('Exceeded maximum gas cost for send operation.');
            }

            const txs = await this.core.baseOps.prependApprove(
                [transferTx],
                [
                    {
                        spender: this.core.safeConfig.paymasterAddress,
                        amount: gasCostInPaymasterToken > BigInt(this.core.safeConfig.minimumPaymasterAllowance)
                            ? BigInt(gasCostInPaymasterToken)
                            : BigInt(this.core.safeConfig.minimumPaymasterAllowance)
                    }
                ],
                this.core.safeConfig
            );

            const hash = await this.core.baseOps.sendGaslessTransaction(safe4337Pack, txs);

            return {
                hash,
                gasCost: Number(gasCostInPaymasterToken)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Gets a quote for a send operation
     * @param {Object} opts - Send quote options
     * @param {string} opts.token - Token contract address
     * @param {string} opts.recipient - Recipient address
     * @param {BigInt} opts.amount - Amount to send
     * @returns {Promise<Object>} Send operation quote
     */
    async quoteSend(opts) {
        try {
            const result = await this.send({
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
} 