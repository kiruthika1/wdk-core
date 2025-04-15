// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

const { ethers } = require('ethers')
const { addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities')
const StargatePoolUsdtABI = require('./StargatePoolUSDT.abi.json')
const constants = require('./constants')

/**
 * BridgeStargate class handles cross-chain USDT transfers using the Stargate protocol
 * This class provides functionality to send USDT tokens between different chains
 * using the LayerZero protocol's Stargate implementation
 */
class BridgeStargate {
  /**
   * Creates a new BridgeStargate instance
   * @param {Object} opts - Configuration options
   * @param {string} opts.chain - Source chain identifier (e.g., 'ethereum', 'bsc')
   * @param {string} opts.providerUrl - RPC provider URL for the source chain
   */
  constructor (opts) {
    this.chain = opts.chain
    this.providerUrl = opts.providerUrl
  }

  /**
   * Builds the parameters required for sending tokens across chains
   * @param {string} chain - Destination chain identifier
   * @param {string} address - Destination address to receive the tokens
   * @param {number} amount - Amount to send in local decimals (e.g., 6 decimals for USDT)
   * @param {number} [nativeTokenDropAmount=0] - Optional amount of native gas token to drop on destination address
   * @returns {Object} Send parameters object containing:
   *   - dstEid: Destination endpoint ID
   *   - to: Destination address in bytes32 format
   *   - amountLD: Amount in local decimals
   *   - minAmountLD: Minimum amount to receive (with 0.1% slippage tolerance)
   *   - extraOptions: Additional options in bytes format
   *   - composeMsg: Composed message (empty in this implementation)
   *   - oftCmd: OFT command (empty in this implementation)
   */
  buildSendParam (chain, address, amount, nativeTokenDropAmount = 0) {
    const options = Options.newOptions()
    const to = addressToBytes32(address)

    if (nativeTokenDropAmount > 0) {
      options.addExecutorNativeDropOption(nativeTokenDropAmount, address)
    }

    return {
      dstEid: constants[chain].eid,
      to,
      amountLD: amount,
      minAmountLD: (amount * 999) / 1000, // 0.1% fee tolerance
      extraOptions: options.toBytes(),
      composeMsg: ethers.getBytes('0x'), // Assuming no composed message
      oftCmd: ethers.getBytes('0x') // Assuming no OFT command is needed
    }
  }

  /**
   * Creates and returns an ethers Contract instance for the Stargate OFT contract
   * @returns {ethers.Contract} Contract instance for interacting with the Stargate OFT contract
   */
  getContract () {
    return new ethers.Contract(
      constants[this.chain].oftContract,
      StargatePoolUsdtABI,
      new ethers.JsonRpcProvider(this.providerUrl)
    )
  }

  /**
   * Prepares transaction data for sending USDT tokens across chains
   * @param {string} chain - Destination chain identifier
   * @param {string} address - Destination address to receive the tokens
   * @param {number} amount - Amount to send in local decimals
   * @param {number} nativeFee - Estimated native fee for the cross-chain transaction
   * @param {string} refundAddress - Address to receive any excess native fees
   * @param {number} [nativeTokenDropAmount=0] - Optional amount of native gas token to drop on destination address
   * @returns {Object} Transaction data object containing:
   *   - data: Encoded function call data
   *   - to: Target contract address
   *   - value: Native fee amount to send with the transaction
   */
  send (
    chain,
    address,
    amount,
    nativeFee,
    refundAddress,
    nativeTokenDropAmount = 0
  ) {
    const oftContract = this.getContract()

    const sendParam = this.buildSendParam(chain, address, amount, nativeTokenDropAmount)

    return {
      data: oftContract.interface.encodeFunctionData('send', [
        sendParam,
        {
          nativeFee,
          lzTokenFee: 0
        },
        refundAddress
      ]),
      to: oftContract.target,
      value: nativeFee
    }
  }

  /**
   * Simulates a cross-chain transfer and returns the estimated native fee
   * @param {string} chain - Destination chain identifier
   * @param {string} address - Destination address to receive the tokens
   * @param {number} amount - Amount to send in local decimals
   * @param {number} [nativeTokenDropAmount=0] - Optional amount of native gas token to drop on destination address
   * @returns {Promise<number>} Estimated native fee required for the cross-chain transfer
   */
  async quoteSend (
    chain,
    address,
    amount,
    nativeTokenDropAmount = 0
  ) {
    const oftContract = this.getContract()

    const sendParam = this.buildSendParam(chain, address, amount, nativeTokenDropAmount)

    const feeQuote = await oftContract.quoteSend(sendParam, false)

    const nativeFee = feeQuote.nativeFee

    return nativeFee
  }
}

module.exports = BridgeStargate
