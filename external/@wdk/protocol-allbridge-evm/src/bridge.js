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

const { ethers, zeroPadValue, hexlify } = require('ethers')
const bs58 = require('bs58').default
const constants = require('./constants')
const { getNonce } = require('./utils')
const AllBridgeAbi = require('./AllBridgeAbi')

/**
 * @typedef {import('./types').SupportedChain} SupportedChain
 * @typedef {import('./types').BridgeOptions} BridgeOptions
 * @typedef {import('./types').TransactionData} TransactionData
 */

/**
 * AllbridgeBridge class provides functionality for building transaction data
 * for the Allbridge protocol on EVM-compatible chains.
 */
class BridgeAllbridge {
  /**
   * Creates a new instance of AllbridgeBridge
   * @param {BridgeOptions} opts - Configuration options including chain and provider URL
   */
  constructor (opts) {
    this.chain = opts.chain
    this.providerUrl = opts.providerUrl

    this.contract = new ethers.Contract(
      constants[this.chain].bridgeContractAddress,
      AllBridgeAbi,
      new ethers.JsonRpcProvider(this.providerUrl)
    )
  }

  /**
   * Get the gas cost of a transaction on another chain in the current chain's native token.
   * @param {SupportedChain} chain - Destination chain identifier
   * @returns {Promise<bigint>} The transaction cost in wei
   */
  async getTransactionCost (chain) {
    return this.contract.getTransactionCost(constants[chain].chainId)
  }

  /**
   * Get the bridging cost in source tokens for a cross-chain transfer.
   * @param {SupportedChain} chain - Destination chain identifier
   * @returns {Promise<bigint>} The bridging cost in source tokens
   */
  async getBridgingCostInTokens (chain) {
    const ownerChain = constants[this.chain]
    return this.contract.getBridgingCostInTokens(
      constants[chain].chainId,
      0,
      ownerChain.usdtAddress
    )
  }

  /**
   * Builds transaction data for initiating a swap and bridge process of a given token
   * for a token on another blockchain.
   * @param {SupportedChain} chain - Destination chain identifier
   * @param {string} recipient - The recipient address on the destination chain
   * @param {string} amount - The amount of tokens to be swapped (including feeTokenAmount)
   * @param {string} [feeTokenAmount='0'] - The amount of tokens to be deducted as a bridging fee
   * @returns {Promise<TransactionData>} The transaction data
   */
  async swapAndBridge (chain, recipient, amount, feeTokenAmount = '0') {
    const ownerChain = constants[this.chain]
    const destinationChain = constants[chain]

    const token = zeroPadValue(ownerChain.usdtAddress, 32)
    let receiveToken = destinationChain.usdtAddress

    const destinationChainId = destinationChain.chainId
    const nonce = getNonce()
    const messenger = 1

    if (chain === 'solana') {
      recipient = hexlify(bs58.decode(recipient))
      receiveToken = hexlify(bs58.decode(receiveToken))
    }

    return {
      data: this.contract.interface.encodeFunctionData('swapAndBridge', [
        token,
        amount,
        zeroPadValue(recipient, 32),
        destinationChainId,
        zeroPadValue(receiveToken, 32),
        nonce,
        messenger,
        feeTokenAmount
      ]),
      to: this.contract.target,
      value: 0
    }
  }

  /**
   * Builds transaction data for completing the bridging process by sending the tokens
   * on the destination chain to the recipient.
   * @param {bigint} amount - The amount of tokens to be swapped
   * @param {string} recipient - The recipient address on the destination chain
   * @param {SupportedChain} sourceChain - Source chain identifier
   * @param {bigint} receiveAmountMin - The minimum amount of receiveToken required to be received
   * @returns {string} The encoded function data for the receiveTokens call
   */
  receiveTokens (amount, recipient, sourceChain, receiveAmountMin) {
    const destinationChain = constants[this.chain]
    const sourceChainData = constants[sourceChain]

    const receiveToken = zeroPadValue(destinationChain.usdtAddress, 32)
    const nonce = getNonce()
    const messenger = 1

    return this.contract.interface.encodeFunctionData('receiveTokens', [
      amount,
      zeroPadValue(recipient, 32),
      sourceChainData.chainId,
      receiveToken,
      nonce,
      messenger,
      receiveAmountMin
    ])
  }
}

module.exports = BridgeAllbridge
