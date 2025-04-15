import type {ChainKey, Coin, Token} from '@wdk-account-abstraction-ton/ui-core';

type OftProxyContract = {
  chainKey: ChainKey;
  address: string;
  approvalRequired?: boolean;
};

type OftContract = {
  chainKey: ChainKey;
  address: string;
  programId?: string; // only for solana
};

type OftNativeContract = {
  chainKey: ChainKey;
  address: string;
};

type TokenEscrowContract = {
  address: string;
};

export type OftBridgeConfig = {
  fee: boolean;
  version: string | number;
  sharedDecimals: number;
  deployments: {[chainKey: ChainKey]: OftBridgeDeployment};
};

export type OftBridgeDeployment = {
  eid: number;
  token: Token | Coin;
  // what is this ? - only for solana
  tokenEscrow?: TokenEscrowContract;
  oft?: OftContract;
  oftProxy?: OftProxyContract;
  oftNative?: OftNativeContract;
  destinationChains?: string[];
  //
  executorLzReceiveOption?: {
    gasLimit: number;
    nativeValue?: number;
  };
};
