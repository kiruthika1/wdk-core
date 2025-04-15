import { Address, Cell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { CurrencyAmount, Token } from '@layerzerolabs/ui-core';
import { WDKAccountAbstractionTON } from './index';

export interface BridgeAddressConfig {
  oftProxy: string;
  controller: string;
  ulnManager: string;
  token: string;
  executor: string;
}

export interface BridgeUlnConfig {
  confirmations: string;
  confirmationsNull: boolean;
  executor: string;
  executorNull: boolean;
  maxMessageBytes: string;
  optionalDVNs: string[];
  optionalDVNsNull: boolean;
  requiredDVNs: string[];
  requiredDVNsNull: boolean;
  workerQuoteGasLimit: string;
}

export interface BridgeBodyInput {
  dstChainKey: 'ethereum' | 'arbitrum' | 'tron';
  srcAddress: string;
  srcAmount: CurrencyAmount;
  dstAddress: string;
  dstAmountMin: CurrencyAmount;
  fee: {
    nativeFee: CurrencyAmount;
  };
  dstNativeAmount: string;
}

export interface BridgeResult {
  hash: string | null;
  gasCostInPaymasterToken: bigint;
  bridgingCostInToken: number;
}

export interface BridgeOptions {
  address: string;
  receiver: string;
  chain: 'ethereum' | 'arbitrum' | 'tron';
  tokenAddress: string;
  tokenDecimals: number;
  nativeTokenDropAmount: string;
  simulate?: boolean;
  keyPair: {
    publicKey: Buffer;
    secretKey: Buffer;
  };
  amount: number;
}

export class Bridge {
  constructor(client: TonClient, accountAbstraction: WDKAccountAbstractionTON);

  /**
   * Initiates a cross-chain token transfer
   * @param opts Bridge operation options
   * @returns Transaction result containing hash, gas cost, and bridging cost
   * @throws {Error} If chain is unsupported or insufficient balance
   */
  bridge(opts: BridgeOptions): Promise<BridgeResult>;

  /**
   * Quotes a bridge operation to estimate costs
   * @param opts Bridge operation options
   * @returns Quote result containing estimated costs
   */
  quoteBridge(opts: Omit<BridgeOptions, 'simulate' | 'keyPair'>): Promise<BridgeResult>;

  /**
   * Gets the bridge body for a transfer
   * @private
   * @param input Bridge body input parameters
   * @returns Bridge body cell
   */
  private _getBridgeBody(input: BridgeBodyInput): Promise<Cell>;

  /**
   * Parses an address to hex format
   * @private
   * @param address Address to parse
   * @returns Hex formatted address
   */
  private _parseAddressToHex(address: string): string;
} 