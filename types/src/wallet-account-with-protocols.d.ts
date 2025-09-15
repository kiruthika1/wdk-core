/** @interface */
export interface IWalletAccountWithProtocols extends IWalletAccount {
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
    registerProtocol<P extends typeof SwapProtocol | typeof BridgeProtocol | typeof LendingProtocol>(label: string, Protocol: P, config: ConstructorParameters<P>[1]): IWalletAccountWithProtocols;
    /**
     * Returns the swap protocol with the given label.
     *
     * @param {string} label - The label.
     * @returns {ISwapProtocol} The swap protocol.
     * @throws {Error} If no swap protocol has been registered on this account with the given label.
     */
    getSwapProtocol(label: string): ISwapProtocol;
    /**
     * Returns the bridge protocol with the given label.
     *
     * @param {string} label - The label.
     * @returns {IBridgeProtocol} The bridge protocol.
     * @throws {Error} If no bridge protocol has been registered on this account with the given label.
     */
    getBridgeProtocol(label: string): IBridgeProtocol;
    /**
     * Returns the lending protocol with the given label.
     *
     * @param {string} label - The label.
     * @returns {ILendingProtocol} The lending protocol.
     * @throws {Error} If no lending protocol has been registered on this account with the given label.
     */
    getLendingProtocol(label: string): ILendingProtocol;
}
export type ISwapProtocol = import("@wdk/wallet/protocols").ISwapProtocol;
export type IBridgeProtocol = import("@wdk/wallet/protocols").IBridgeProtocol;
export type ILendingProtocol = import("@wdk/wallet/protocols").ILendingProtocol;
import { IWalletAccount } from "@wdk/wallet";
import { SwapProtocol, BridgeProtocol, LendingProtocol } from "@wdk/wallet/protocols";
