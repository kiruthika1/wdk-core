import { Contract, JsonRpcProvider } from 'ethers';

export interface SafeConfig {
  bundlerUrl: string;
  paymasterUrl: string;
  paymasterAddress: string;
  paymasterToken: {
    address: string;
    decimals: number;
    symbol: string;
  };
  minimumPaymasterAllowance: number;
  maximumPremiumOnGasCost: number;
  entrypointAddress: string;
  paymasterTokenOracleAddress: string;
  sendMaxFee: number;
  swapMaxFee: number;
  bridgeMaxFee: number;
}

export interface BasicWallet {
  address: string;
  privateKey: string;
}

export interface Safe4337Pack {
  protocolKit: Contract;
  signer: any;
  bundlerUrl: string;
  paymasterUrl: string;
  paymasterAddress: string;
  paymasterTokenAddress: string;
  paymasterTokenOracleAddress: string;
  paymasterOptions: {
    token: string;
    minAllowance: number;
    maxPremium: number;
  };
  options: {
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    callGasLimit?: string;
    verificationGasLimit?: string;
    preVerificationGas?: string;
  };
  createTransaction: (tx: any) => Promise<any>;
  signSafeOperation: (op: any) => Promise<any>;
  executeTransaction: (op: any) => Promise<any>;
  getUserOperationReceipt: (hash: string) => Promise<any>;
  getAddress: () => Promise<string>;
}

export interface TransactionResult {
  hash: string | null;
  gasCostInPaymasterToken: number;
  tokenInAmount?: string;
  tokenOutAmount?: string;
  bridgingCostInToken?: number;
  userOpHash?: string;
}

export interface QuoteResult {
  details?: string;
  success: boolean;
  hash?: string | null;
  gasCostInPaymasterToken?: number;
  tokenInAmount?: string;
  tokenOutAmount?: string;
  bridgingCostInToken?: number;
  estimatedGas?: string;
}

export interface BaseOptions {
  safe4337Pack: Safe4337Pack;
  simulate?: boolean;
}

export interface SendOptions extends BaseOptions {
  token: string;
  amount: string;
  receiver: string;
}

export interface SwapOptions extends BaseOptions {
  tokenIn: string;
  tokenOut: string;
  tokenInAmount?: string;
  tokenOutAmount?: string;
  amountUnit?: 'base' | 'display';
  slippage?: number;
}

export interface BridgeOptions extends BaseOptions {
  chain: string;
  token: string;
  amount: string;
  receiver: string;
  nativeTokenDropAmount?: string;
  slippage?: number;
}

export interface WDKBaseEVMInterface {
  provider: JsonRpcProvider;
  config: SafeConfig;
  getSafe4337Pack(wallet: BasicWallet): Promise<Safe4337Pack>;
  getAbstractedAddress(safe4337Pack: Safe4337Pack): Promise<string>;
  getGaslessTransactionReceipt(safe4337Pack: Safe4337Pack, id: string): Promise<any>;
}

export interface WDKSendEVMInterface extends WDKBaseEVMInterface {
  send(opts: SendOptions): Promise<TransactionResult>;
  quoteSend(opts: SendOptions): Promise<QuoteResult>;
}

export interface WDKSwapEVMInterface extends WDKBaseEVMInterface {
  swap(opts: SwapOptions): Promise<TransactionResult>;
  quoteSwap(opts: SwapOptions): Promise<QuoteResult>;
}

export interface WDKBridgeEVMInterface extends WDKBaseEVMInterface {
  bridge(opts: BridgeOptions): Promise<TransactionResult>;
  quoteBridge(opts: BridgeOptions): Promise<QuoteResult>;
}

export interface ChainInterface {
  chain1: string;
  chain2: string;
  interface: any;
} 