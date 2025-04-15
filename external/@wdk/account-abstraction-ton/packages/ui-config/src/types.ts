export type Contract = {
  address: string;
};

export type DeploymentV1 = {
  version: 1;
  stage: string;
  chainKey: string;
  endpoint: Contract;
  eid: number;
  isDeprecated?: boolean;
  relayer?: Contract;
  relayerV2?: Contract;
  ultraLightNode?: Contract;
  ultraLightNodeV2?: Contract;
};

export type DeploymentV2 = {
  version: 2;
  stage: string;
  eid: number;
  chainKey: string;
  endpointV2: Contract;
  isDeprecated?: boolean;
  executor?: Contract;
  lzExecutor?: Contract;
  sendUln301?: Contract;
  sendUln302?: Contract;
  receiveUln301?: Contract;
  receiveUln302?: Contract;
};

export type DVN = {
  name: string;
  address: string;
  chainKey: string;
  eid: number;
};

export interface NetworkInfo {
  chainKey: string;
  chainType: string;
  nativeChainId: number | string;
  name: string;
  shortName: string;
  nativeCurrency: {name: string; symbol: string; decimals: number; address?: string};
}

export interface Rpc {
  url: string;
  weight?: number;
  timeout?: number;
  isPublic?: boolean;
  isActive?: boolean; // by default
}

export type Deployment = DeploymentV1 | DeploymentV2;
