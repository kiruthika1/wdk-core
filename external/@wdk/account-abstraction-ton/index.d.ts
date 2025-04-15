import { Address, Cell, SendMode } from '@ton/core';
import { TonClient } from '@ton/ton';
import { TonApiClient } from '@ton-api/client';
import { Bridge } from './bridge';

export interface BasicWallet {
  address: string;
  privateKey: Buffer;
  contract: any; // Using any for now as the contract type is complex
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
  amount: BigInt;
}

export interface BridgeResult {
  hash: string | null;
  gasCostInPaymasterToken: BigInt;
}

export interface GaslessTransferOptions extends TransferOptions {
  jettonMaster: string;
}

export interface KeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

export interface QuoteBridgeOptions extends Omit<BridgeOptions, 'simulate' | 'keyPair'> {}

export interface QuoteBridgeResult {
  details?: string;
  success: boolean;
  hash?: string | null;
  gasCostInPaymasterToken?: BigInt;
}

export interface QuoteResult {
  details?: string;
  success: boolean;
  hash?: string | null;
  gasCostInPaymasterToken?: BigInt;
}

export interface QuoteSendOptions extends Omit<SendOptions, 'simulate'> {}

export interface SendOptions {
  publicKey: Buffer;
  privateKey: Buffer;
  destination: string;
  amount: BigInt;
  jettonMaster: string;
  simulate?: boolean;
}

export interface SendResult {
  hash: string | null;
  gasCostInPaymasterToken: BigInt;
}

export interface TonConfig {
  tonApiEndpoint?: string;
  tonCenterEndpoint?: string;
  tonApiKey?: string;
  tonCenterApiKey?: string;
}

export interface TransferOptions {
  wallet: BasicWallet;
  destination: string;
  amount: BigInt;
}

export class WDKAccountAbstractionTON {
  constructor(config: TonConfig);
  
  bridge(opts: BridgeOptions): Promise<BridgeResult>;
  convertTransactionAddressToHex(base64Address: string): string;
  getJettonBalance(jettonAddress: Address, walletAddress: Address): Promise<BigInt>;
  getJettonWalletAddress(keyPair: KeyPair, jettonAddress: Address): Promise<Address>;
  getRawAddress(address: string): string;
  getUserAddress(rawAddress: string): string;
  initializeWallet(keyPair: KeyPair): Promise<BasicWallet>;
  quoteBridge(opts: QuoteBridgeOptions): Promise<QuoteBridgeResult>;
  quoteSend(opts: QuoteSendOptions): Promise<QuoteResult>;
  send(opts: SendOptions): Promise<SendResult>;
  sendGaslessTransaction(opts: GaslessTransferOptions): Promise<SendResult>;
} 