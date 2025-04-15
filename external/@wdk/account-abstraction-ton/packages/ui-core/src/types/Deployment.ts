import type {ChainKey} from './ChainKey';
import type {Stage} from './Stage';

type Contract = {
  address: string;
};

export interface DeploymentV1 {
  eid: number;
  chainKey: ChainKey;
  stage: Stage;
  version: 1;
  endpointV1?: Contract;
  treasury?: Contract;
  relayerV1?: Contract;
  relayerV2?: Contract;
  priceFeed?: Contract;
  ultraLightNodeV2?: Contract;
}
export interface DeploymentV2 {
  eid: number;
  chainKey: ChainKey;
  stage: Stage;
  version: 2;
  endpointV2?: Contract;
  treasury?: Contract;
  executor?: Contract;
  executorFeeLib?: Contract;
  lzExecutor?: Contract;
  priceFeed?: Contract;
  receiveUln301?: Contract;
  receiveUln302?: Contract;
  sendUln301?: Contract;
  sendUln302?: Contract;
}

export type Deployment = DeploymentV1 | DeploymentV2;
