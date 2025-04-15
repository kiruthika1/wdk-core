/**
 * Supported chains for USDT0 bridge operations
 */
export type SupportedChain = 'ethereum' | 'arbitrum' | 'berachain' | 'ink' | 'tron' | 'ton';

/**
 * Base options for bridge initialization
 */
export interface BridgeOptions {
  chain: SupportedChain;
  providerUrl: string;
}

/**
 * Options for Tron bridge initialization
 */
export interface BridgeTronOptions extends BridgeOptions {
  tronGridApiKey: string;
}

/**
 * Send parameters for cross-chain transfer
 */
export interface SendParam {
  dstEid: number;
  to: string;
  amountLD: bigint;
  minAmountLD: bigint;
  extraOptions: Uint8Array;
  composeMsg: Uint8Array;
  oftCmd: Uint8Array;
}

/**
 * Fee structure for cross-chain transfer
 */
export interface FeeQuote {
  nativeFee: bigint;
  lzTokenFee: bigint;
}

/**
 * Transaction data for cross-chain transfer
 */
export interface TransactionData {
  data: string;
  to: string;
  value: bigint;
}

/**
 * Interface for the OFT contract
 */
export interface OFTContract {
  interface: {
    encodeFunctionData: (functionName: string, args: any[]) => string;
  };
  target: string;
  quoteSend: (sendParam: SendParam, useZro: boolean) => Promise<FeeQuote>;
}

/**
 * Interface for the transaction value helper contract
 */
export interface TransactionValueHelperContract {
  interface: {
    encodeFunctionData: (functionName: string, args: any[]) => string;
  };
  target: string;
  quoteSend: (sendParam: SendParam, fees: [bigint, bigint]) => Promise<bigint>;
}

/**
 * Interface for the Tron contract
 */
export interface TronContract {
  quoteSend: (params: any[], useZro: boolean) => {
    call: (options: TronCallOptions) => Promise<{
      msgFee: {
        nativeFee: bigint;
      };
    }>;
  };
}

/**
 * Options for Tron contract calls
 */
export interface TronCallOptions {
  _isConstant: boolean;
  callValue: number;
  feeLimit: number;
  from: string;
  owner_address: string;
}

/**
 * Chain-specific configuration
 */
export interface ChainConfig {
  eid: number;
  legacyMeshContract: string;
  oftContract: string;
  transactionValueHelper?: string;
}

/**
 * Error types for bridge operations
 */
export enum BridgeError {
  INVALID_CHAIN = 'INVALID_CHAIN',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_NATIVE_DROP = 'INVALID_NATIVE_DROP',
  INVALID_CONTRACT = 'INVALID_CONTRACT',
  INVALID_TRON_API_KEY = 'INVALID_TRON_API_KEY',
  INVALID_TRON_CONTRACT = 'INVALID_TRON_CONTRACT'
}
