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

import { TronWeb } from "tronweb";
import { addressToBytes32 } from "@layerzerolabs/lz-v2-utilities";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { Address } from '@ton/core';
import TetherTokenOFTExtensionTronABI from "./TetherTokenOFTExtensionTron.abi.json";
import constants from "./constants";

const ZeroAddress = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

export class BridgeTron {
  constructor(opts) {
    this.chain = opts.chain;
    this.providerUrl = opts.providerUrl;
    this.tronWeb = new TronWeb({
      fullHost: this.providerUrl,
      headers: { "TRON-PRO-API-KEY": opts.tronGridApiKey },
    });
  }

  /**
   * @description Build send param
   * @param {string} chain Destination chain identifier
   * @param {string} address Destination address
   * @param {number} amount Amount to send in local decimals
   * @param {number} nativeTokenDropAmount Native amount in gas token to drop on destination address
   * @return {object} Send param (tuple)
   */
  buildSendParam(chain, address, amount, nativeTokenDropAmount = 0) {
    const options = Options.newOptions();

    let to;

    if (chain === 'ton') {
      to = '0x' + Address.parse(address).toRawString().slice(2)
    } else if (chain === 'tron') {
      const hexAddress = `0x${TronWeb.address.toHex(address)}`
      to = addressToBytes32(hexAddress)
    } else {
      to = addressToBytes32(address)
    }

    if (nativeTokenDropAmount > 0 && chain !== 'ton')
      options.addExecutorNativeDropOption(nativeTokenDropAmount, address);

    return {
      dstEid: constants[chain].eid,
      to: to,
      amountLD: amount,
      minAmountLD: (amount * 999) / 1000, // 0.1% fee tolerance
      extraOptions: options.toBytes(),
      composeMsg: "0x", // Assuming no composed message
      oftCmd: "0x", // Assuming no OFT command is needed
    };
  }

  /**
   * @description Get contract to use
   * @param {string} chain Destination chain identifier
   * @return {Object} Contract to use
   */
  async getContract() {
    const contractAddress = constants[this.chain].legacyMeshContract;

    const contract = this.tronWeb.contract(
      TetherTokenOFTExtensionTronABI,
      contractAddress
    );
    return contract;
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
  async send(
    chain,
    address,
    amount,
    nativeFee,
    refundAddress,
    nativeTokenDropAmount = 0
  ) {
    const oftContract = await this.getContract();

    const sendParam = this.buildSendParam(
      chain,
      address,
      amount,
      nativeTokenDropAmount
    );

    const sendParamArray = [
      sendParam.dstEid,
      sendParam.to,
      sendParam.amountLD.toString(),
      sendParam.minAmountLD.toString(),
      sendParam.extraOptions,
      sendParam.composeMsg,
      sendParam.oftCmd,
    ];

    const encodedParams = await this.tronWeb.utils.abi.encodeParams(
      [
        "tuple(uint32,bytes32,uint256,uint256,bytes,bytes,bytes)",
        "tuple(uint256,uint256)",
        "address",
      ],
      [sendParamArray, [nativeFee, 0], refundAddress]
    );

    const result = "c7c7f5b3" + encodedParams.slice(2);

    return result;
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
    const oftContract = await this.getContract();

    const sendParam = this.buildSendParam(
      chain,
      address,
      amount,
      nativeTokenDropAmount
    );

    const sendParamArray = [
      sendParam.dstEid,
      sendParam.to,
      sendParam.amountLD.toString(),
      sendParam.minAmountLD.toString(),
      sendParam.extraOptions,
      sendParam.composeMsg,
      sendParam.oftCmd,
    ];

    const result = await oftContract.quoteSend(sendParamArray, false).call({
      _isConstant: false,
      callValue: 0,
      feeLimit: 100_000_000,
      from: ZeroAddress,
      owner_address: ZeroAddress,
    });

    const nativeFee = result.msgFee.nativeFee.toString();

    return nativeFee;
  }
}
