import type {Currency} from '../currency';
import type {BlockExplorer, Network, NetworkInfo} from '../network/types';
import type {Deployment} from '../types/Deployment';
import type {ChainKey} from '../types/ChainKey';
import type {RpcMap} from '../types/Rpc';
import {networkSchema} from '../network';
import type {ChainType} from '../types/ChainType';
import type {Stage} from '../types/Stage';

export class CoreModule {
  protected _networks: Network[] = [];
  protected _networkByChainKey = new Map<string, Network>();
  protected _deployments: Deployment[] = [];
  protected _deploymentByEndpointId = new Map<number, Deployment>();
  protected _rpcMap: RpcMap = {};
  protected _log = console;
  protected _blockExplorers: Record<ChainKey, BlockExplorer[]> = {};

  constructor() {}

  public get networks(): Network[] {
    return this._networks;
  }

  public get rpcMap(): RpcMap {
    return this._rpcMap;
  }

  public get blockExplorers(): Record<ChainKey, BlockExplorer[]> {
    return this.blockExplorers;
  }

  public setNetworks<TNetworkInfo extends NetworkInfo>(networks: TNetworkInfo[]) {
    this._networks = networkSchema.array().parse(networks);
    this._networkByChainKey = new Map();
    for (const network of this._networks) {
      this._networkByChainKey.set(network.chainKey, network);
    }
  }

  public setDeployments(deployments: Deployment[]) {
    this._deployments = deployments;
    this._deploymentByEndpointId = new Map();
    for (const deployment of deployments) {
      this._deploymentByEndpointId.set(deployment.eid, deployment);
    }
  }

  public setBlockExplorers(blockExplorers: Record<ChainKey, BlockExplorer[]>) {
    this._blockExplorers = blockExplorers;
  }

  public setRpcMap(rpcMap: RpcMap) {
    this._rpcMap = rpcMap;
  }

  // Network
  tryGetNetwork = (chainKey: ChainKey | undefined): Network | undefined => {
    if (chainKey === undefined) return undefined;
    return this._networkByChainKey.get(chainKey);
  };

  getNetwork = (chainKey: ChainKey): Network => {
    const network = this.tryGetNetwork(chainKey);
    if (!network) {
      throw new Error(`No network for chainKey: ${chainKey}`);
    }
    return network;
  };

  tryGetNetworkByNativeChainId = (
    chainType?: ChainType,
    nativeChainId?: number | string,
  ): Network | undefined => {
    if (chainType === undefined) return undefined;
    if (nativeChainId === undefined) return undefined;
    for (const network of this.networks) {
      if (nativeChainId === network.nativeChainId && chainType === network.chainType) {
        return network;
      }
    }
  };

  getRpcs = (chainKey: ChainKey) => {
    return this.rpcMap[chainKey] ?? [];
  };

  getBlockExplorers = (chainKey: ChainKey) => {
    return this._blockExplorers[chainKey] ?? [];
  };

  getNetworkByNativeChainId = (chainType: ChainType, nativeChainId: number | string): Network => {
    const network = this.tryGetNetworkByNativeChainId(chainType, nativeChainId);
    if (network) return network;

    throw new Error(`No network for chainType: ${chainType} and native chain id: ${nativeChainId}`);
  };

  tryGetNativeCurrency = (chainKey: ChainKey | undefined): Currency | undefined => {
    const network = this.tryGetNetwork(chainKey);
    return network?.nativeCurrency;
  };

  getNativeCurrency = (chainKey: ChainKey): Currency => {
    return this.getNetwork(chainKey).nativeCurrency;
  };

  getScanLink(
    input:
      | {
          txHash: string;
          chainKey: string;
        }
      | {
          address: string;
          chainKey: string;
        },
  ): string {
    const domain = input.chainKey.endsWith('-sandbox' as string)
      ? 'sandbox.layerzeroscan.com'
      : 'layerzeroscan.com';

    if ('address' in input) {
      return `https://${domain}/address/${input.address}`;
    }
    if ('txHash' in input) {
      return `https://${domain}/tx/${input.txHash}`;
    }
    return `https://${domain}/`;
  }

  isNativeCurrency = (currency: Currency): boolean => {
    const nativeCurrency = this.getNativeCurrency(currency.chainKey);
    return nativeCurrency.equals(currency);
  };

  endpointIdToStage = (endpointId: number): Stage => {
    const deployment = this.getDeployment(endpointId);
    return deployment.stage as Stage;
  };

  tryGetDeployment = (endpointId: number): Deployment | undefined => {
    return this._deploymentByEndpointId.get(endpointId);
  };

  getDeployment = (endpointId: number): Deployment => {
    const deployment = this.tryGetDeployment(endpointId);
    if (deployment) return deployment;
    throw new Error(`No deployment for endpointId: ${endpointId}`);
  };

  getNetworks() {
    return this._networks;
  }

  getDeployments() {
    return this._deployments;
  }

  endpointIdToChainKey = (endpointId: number): string => {
    const deployment = this.getDeployment(endpointId);
    if (deployment) return deployment.chainKey;
    throw new Error(`No chainKey for endpointId: ${endpointId}`);
  };

  chainKeyToEndpointId = (chainKey: string, endpointVersion: 1 | 2, stage: Stage): number => {
    for (const deployment of this._deployments) {
      if (deployment.chainKey !== chainKey) continue;
      if (deployment.stage !== stage) continue;
      if (deployment.version !== endpointVersion) continue;
      return deployment.eid;
    }
    throw new Error(
      `No EndpointId for chainKey: ${chainKey} and endpointVersion: ${endpointVersion} and stage: ${stage}`,
    );
  };

  isChainType = (chainKey: ChainKey, chainType: ChainType): boolean => {
    const network = this.getNetwork(chainKey);
    return network.chainType === chainType;
  };
}
