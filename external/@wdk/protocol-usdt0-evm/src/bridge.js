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
"use strict";

const { ethers } = require("ethers");
const { addressToBytes32 } = require("@layerzerolabs/lz-v2-utilities");
const { Options } = require("@layerzerolabs/lz-v2-utilities");
const { Address } = require('@ton/core')
const { TronWeb } = require("tronweb");
const TetherTokenOFTExtensionABI = require("./TetherTokenOFTExtension.abi.json");
const constants = require("./constants");

class Bridge {
  constructor(opts) {
    this.chain = opts.chain;
    this.providerUrl = opts.providerUrl;
  }

  /**
   * @description Build send param
   * @param {string} chain Destination chain identifier
   * @param {string} address Destination address
   * @param {number} amount Amount to send in local decimals
   * @param {number} nativeTokenDropAmount Native amount in gas token to drop on destination address
   * @return {object} Send param
   */
  buildSendParam(chain, address, amount, nativeTokenDropAmount = 0) {
    const options = Options.newOptions();

    console.log('chain', chain)

    let to;

    if (chain === 'ton') {
      to = '0x' + Address.parse(address).toRawString().slice(2)
    } else if (chain === 'tron') {
      const hexAddress = `0x${TronWeb.address.toHex(address)}`
      to = addressToBytes32(hexAddress)
    } else {
      to = addressToBytes32(address)
    }

    console.log('to', to)
    
    if (nativeTokenDropAmount > 0 && chain !== 'ton')
      options.addExecutorNativeDropOption(nativeTokenDropAmount, address);

    console.log('chai', chain)

    return {
      dstEid: constants[chain].eid,
      to: to,
      amountLD: amount,
      minAmountLD: (amount * 999) / 1000, // 0.1% fee tolerance
      extraOptions: options.toBytes(),
      composeMsg: ethers.getBytes("0x"), // Assuming no composed message
      oftCmd: ethers.getBytes("0x"), // Assuming no OFT command is needed
    };
  }

  /**
   * @description Get contract to use
   * @param {string} chain Destination chain identifier
   * @return {Object} Contract to use
   */
  getContract(chain) {
    const isLegacyMeshRequired = ["tron", "ton"].includes(chain);

    return new ethers.Contract(
      isLegacyMeshRequired
        ? constants[this.chain].legacyMeshContract
        : constants[this.chain].oftContract,
      TetherTokenOFTExtensionABI,
      new ethers.JsonRpcProvider(this.providerUrl)
    );
  }

  /**
   * @description Send USDT0 from one chain to another
   * @param {string} chain Destination chain identifier
   * @param {string} address Destination address
   * @param {number} amount Amount to send in local decimals
   * @param {number} nativeFee Estimated native fee
   * @param {address} refundAddress Refund address
   * @param {number} nativeTokenDropAmount Native amount in gas token to drop on destination address
   * @return {Object} Transaction data
   */
  send(chain, address, amount, nativeFee, refundAddress, nativeTokenDropAmount = 0) {
    const oftContract = this.getContract(chain);

    const sendParam = this.buildSendParam(chain, address, amount, nativeTokenDropAmount);

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
    };
  }

  /**
   * @description Simulate USDT0 transfer from one chain to another
   * @param {string} chain Destination chain identifier
   * @param {string} address Destination address
   * @param {number} amount Amount to send in local decimals
   * @param {number} nativeTokenDropAmount Native amount in gas token to drop on destination address
   * @return {number} Quoted fee
   */
  async quoteSend(chain, address, amount, nativeTokenDropAmount = 0) {
    const oftContract = this.getContract(chain);

    const sendParam = this.buildSendParam(chain, address, amount, nativeTokenDropAmount);

    const feeQuote = await oftContract.quoteSend(sendParam, false);
    const nativeFee = feeQuote.nativeFee;

    return nativeFee;
  }
}

module.exports = Bridge;
