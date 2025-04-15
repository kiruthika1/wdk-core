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
const constants = require("./constants");
const { isBigIntInfinity } = require("./utils");
const AavePoolV3ABI = require("./AavePoolV3.abi.json");

/**
 * @typedef {import('./types').SupportedChain} SupportedChain
 * @typedef {import('./types').AaveOptions} AaveOptions
 * @typedef {import('./types').UserAccountData} UserAccountData
 * @typedef {import('./types').TransactionData} TransactionData
 */

/**
 * LendingAave class provides functionality for interacting with the Aave lending protocol
 * on EVM-compatible chains.
 */
class LendingAave {
  /**
   * Creates a new instance of LendingAave
   * @param {AaveOptions} opts - Configuration options including chain and provider URL
   */
  constructor(opts) {
    this.chain = opts.chain;
    this.providerUrl = opts.providerUrl;

    this.contract = new ethers.Contract(
      constants[this.chain].poolV3Contract,
      AavePoolV3ABI,
      new ethers.JsonRpcProvider(this.providerUrl)
    );
  }

  /**
   * Returns the user account data across all the reserves.
   * @param {string} address - User address
   * @returns {Promise<UserAccountData>} User account data including collateral, debt, and health factor
   */
  async getUserAccountData(address) {
    const userAccountData = await this.contract.getUserAccountData(address);

    return {
      totalCollateralBase: +userAccountData[0].toString(),
      totalDebtBase: +userAccountData[1].toString(),
      availableBorrowsBase: +userAccountData[2].toString(),
      currentLiquidationThreshold: +userAccountData[3].toString(),
      ltv: +userAccountData[4].toString(),
      healthFactor: isBigIntInfinity(userAccountData[5])
        ? Infinity
        : +userAccountData[5].toString(),
    };
  }

  /**
   * Supplies an asset to the Aave pool
   * @param {string} tokenAddress - The token you want to lend
   * @param {number} amount - The amount of the asset to supply (in smallest units, e.g., wei)
   * @param {string} onBehalfOf - The address receiving the aTokens. Use the sender's address if self-supplying
   * @returns {TransactionData} Transaction data for supplying assets to Aave
   */
  supply(tokenAddress, amount, onBehalfOf) {
    return {
      data: this.contract.interface.encodeFunctionData("supply", [
        tokenAddress,
        amount,
        onBehalfOf,
        0,
      ]),
      to: this.contract.target,
      value: 0
    }
  }

  /**
   * Allows suppliers to enable/disable a specific supplied asset as collateral
   * @param {string} tokenAddress - The token you want to enable as collateral
   * @param {boolean} useAsCollateral - `true` if the user wants to use the supply as collateral, `false` otherwise
   * @returns {TransactionData} Transaction data for setting collateral usage
   */
  setUserUseReserveAsCollateral(tokenAddress, useAsCollateral) {
    return {
      data: this.contract.interface.encodeFunctionData(
        "setUserUseReserveAsCollateral",
        [tokenAddress, useAsCollateral]
      ),
      to: this.contract.target,
      value: 0
    }
  }

  /**
   * Withdraws an amount of underlying asset from the reserve, burning the equivalent aTokens owned
   * @param {string} tokenAddress - The token you want to withdraw
   * @param {number} amount - The amount to be withdrawn, expressed in wei units
   * @param {string} to - The address that will receive the underlying, same as msg.sender if the user wants to receive it on their own wallet, or a different address if the beneficiary is a different wallet
   * @returns {TransactionData} Transaction data for withdrawing assets from Aave
   */
  withdraw(tokenAddress, amount, to) {
    return {
      data: this.contract.interface.encodeFunctionData("withdraw", [
        tokenAddress,
        amount,
        to,
      ]),
      to: this.contract.target,
      value: 0
    }
  }

  /**
   * Allows users to borrow a specific amount of the reserve underlying asset
   * @param {string} tokenAddress - The token you want to borrow
   * @param {number} amount - The amount to be borrowed, expressed in wei units
   * @param {string} onBehalfOf - This should be the address of the borrower calling the function if they want to borrow against their own collateral, or the address of the credit delegator if the caller has been given credit delegation allowance
   * @returns {TransactionData} Transaction data for borrowing assets from Aave
   */
  borrow(tokenAddress, amount, onBehalfOf) {
    return {
      data: this.contract.interface.encodeFunctionData("borrow", [
        tokenAddress,
        amount,
        2,
        0,
        onBehalfOf,
      ]),
      to: this.contract.target,
      value: 0
    }
  }

  /**
   * Repays a borrowed amount on a specific reserve, burning the equivalent debt tokens owned
   * @param {string} tokenAddress - The token you want to repay
   * @param {number} amount - The amount to be repaid, expressed in wei units
   * @param {string} onBehalfOf - This should be the address of the borrower calling the function if they want to repay their own debt, or the address of the credit delegator if the caller has been given credit delegation allowance
   * @returns {TransactionData} Transaction data for repaying borrowed assets to Aave
   */
  repay(tokenAddress, amount, onBehalfOf) {
    return {
      data: this.contract.interface.encodeFunctionData("repay", [
        tokenAddress,
        amount,
        2,
        onBehalfOf,
      ]),
      to: this.contract.target,
      value: 0,
    };
  }
}

module.exports = LendingAave;
