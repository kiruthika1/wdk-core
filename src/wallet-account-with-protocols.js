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

import { IWalletAccount, NotImplementedError } from '@tetherto/wdk-wallet'

/** @typedef {import('@tetherto/wdk-wallet/protocols').ISwapProtocol} ISwapProtocol */

/** @typedef {import('@tetherto/wdk-wallet/protocols').IBridgeProtocol} IBridgeProtocol */

/** @typedef {import('@tetherto/wdk-wallet/protocols').ILendingProtocol} ILendingProtocol */

/** @interface */
export class IWalletAccountWithProtocols extends IWalletAccount {
  /**
   * Registers a new protocol for this account
   *
   * The label must be unique in the scope of the account and the type of protocol (i.e., there can’t be two protocols of the same
   * type bound to the same account with the same label).
   *
   * @template {typeof SwapProtocol | typeof BridgeProtocol | typeof LendingProtocol} P
   * @param {string} label - The label.
   * @param {P} Protocol - The protocol class.
   * @param {ConstructorParameters<P>[1]} config - The protocol configuration.
   * @returns {IWalletAccountWithProtocols} The account.
   */
  registerProtocol (label, Protocol, config) {
    throw new NotImplementedError('registerProtocol(label, Protocol, config)')
  }

  /**
   * Returns the swap protocol with the given label.
   *
   * @param {string} label - The label.
   * @returns {ISwapProtocol} The swap protocol.
   * @throws {Error} If no swap protocol has been registered on this account with the given label.
   */
  getSwapProtocol (label) {
    throw new NotImplementedError('getSwapProtocol(label)')
  }

  /**
   * Returns the bridge protocol with the given label.
   *
   * @param {string} label - The label.
   * @returns {IBridgeProtocol} The bridge protocol.
   * @throws {Error} If no bridge protocol has been registered on this account with the given label.
   */
  getBridgeProtocol (label) {
    throw new NotImplementedError('getBridgeProtocol(label)')
  }

  /**
   * Returns the lending protocol with the given label.
   *
   * @param {string} label - The label.
   * @returns {ILendingProtocol} The lending protocol.
   * @throws {Error} If no lending protocol has been registered on this account with the given label.
   */
  getLendingProtocol (label) {
    throw new NotImplementedError('getLendingProtocol(label)')
  }
}
