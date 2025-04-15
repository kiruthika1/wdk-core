import { Address, Cell } from '@ton/core';
import { CurrencyAmount } from '@layerzerolabs/ui-core';

export interface TonConfig {
  tonApiEndpoint?: string;
  tonCenterEndpoint?: string;
  tonApiKey?: string;
  tonCenterApiKey?: string;
}

export interface BasicWallet {
  address: string;
  privateKey: Buffer;
  contract: any; // TODO: Add proper type for contract
}

export interface TransferOptions {
  wallet: BasicWallet;
  destination: string;
  amount: bigint;
}

export interface BridgeOptions {
  address: string;
  receiver: string;
  chain: 'ethereum' | 'arbitrum' | 'tron';
  tokenAddress: string;
  tokenDecimals: number;
  nativeTokenDropAmount: string;
  simulate?: boolean;
  publicKey: Buffer;
  privateKey: Buffer;
  amount: number;
}

export interface GaslessTransactionOptions {
  keyPair: {
    publicKey: Buffer;
    secretKey: Buffer;
  };
  boc: string;
  jettonMasterAddress: string;
  simulate?: boolean;
}

export interface SendOptions {
  publicKey: Buffer;
  privateKey: Buffer;
  destination: string;
  amount: number;
  jettonMaster: string;
  simulate?: boolean;
}

export interface QuoteSendOptions {
  publicKey: Buffer;
  privateKey: Buffer;
  destination: string;
  amount: number;
  jettonMaster: string;
}

export interface QuoteResult {
  hash: string | null;
  gasCostInPaymasterToken: number;
  success: boolean;
  details?: string;
}

export interface BridgeResult {
  hash: string | null;
  gasCostInPaymasterToken: number;
  bridgingCostInToken: number;
}

export interface BridgeInput {
  dstChainKey: string;
  srcAddress: string;
  srcAmount: CurrencyAmount;
  dstAddress: string;
  dstAmountMin: CurrencyAmount;
  fee: {
    nativeFee: CurrencyAmount;
  };
  dstNativeAmount: bigint;
}

declare class WDKAccountAbstractionTON {
  constructor(config: TonConfig);
  initializeWallet(keyPair: { publicKey: Buffer; secretKey: Buffer }): Promise<BasicWallet>;
  createTransfer(opts: TransferOptions): Promise<any>;
  _getRelayAddress(): Promise<Address>;
  bridge(opts: BridgeOptions): Promise<BridgeResult>;
  quoteBridge(opts: BridgeOptions): Promise<QuoteResult>;
  getJettonBalance(jettonAddress: Address, walletAddress: Address): Promise<bigint>;
  getJettonWalletAddress(keyPair: { publicKey: Buffer }, jettonAddress: Address): Promise<Address>;
  sendGaslessTransaction(opts: GaslessTransactionOptions): Promise<{ hash: string | null; commission: number }>;
  send(opts: SendOptions): Promise<{ hash: string | null; gasCostInPaymasterToken: number }>;
  quoteSend(opts: QuoteSendOptions): Promise<QuoteResult>;
  getRawAddress(address: string): string;
  getUserAddress(rawAddress: string): string;
  convertTransactionAddressToHex(base64Address: string): string;
}

declare class BridgeOperations {
  constructor(client: any, accountAbstraction: WDKAccountAbstractionTON);
  bridge(opts: BridgeOptions): Promise<BridgeResult>;
  quoteBridge(opts: BridgeOptions): Promise<QuoteResult>;
  _getBridgeBody(input: BridgeInput): Promise<Cell>;
  _parseAddressToHex(address: string): string;
}

export { WDKAccountAbstractionTON, BridgeOperations };
