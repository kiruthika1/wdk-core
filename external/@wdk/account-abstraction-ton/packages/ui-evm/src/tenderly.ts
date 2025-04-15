import http from 'redaxios';
import {JsonRpcProvider, BaseProvider, type Network} from '@ethersproject/providers';
import {BigNumber, utils} from 'ethers';
import {type ChainKey, assert, getNetwork, waitFor} from '@wdk-account-abstraction-ton/ui-core';
import type {ProviderFactory} from './providerFactory';
import {
  type TestingFork,
  type TestingSdk,
  type TestingProvider,
  TestingProxyProvider,
} from './testing';

type HttpClient = ReturnType<typeof http.create>;

// we need to apply this weird construct because JsonRpcProvider constructor
// requires passing resolved URL which we don't have at the time of creation
export class TenderlyProvider extends BaseProvider implements TestingProvider {
  protected jsonRpcProvider: JsonRpcProvider = null!;

  constructor(
    public readonly fork: TenderlyFork,
    public readonly options: TenderlyProviderOptions = {},
  ) {
    super('any');
  }

  startFork(): Promise<void> {
    return this.fork.start();
  }

  stopFork(): Promise<void> {
    return this.fork.stop();
  }

  override async detectNetwork(): Promise<Network> {
    // find better approach
    const {fork} = this;
    await waitFor(() => fork.forkData !== undefined, {
      timeout: this.options.timeout,
    });
    assert(fork.forkData, 'Fork not started');
    assert(fork.forkUrl, 'Fork has no URL');
    const network: Network = {
      chainId: fork.forkData.simulation_fork.chain_config.chain_id,
      name: `Tenderly fork`,
    };
    this.jsonRpcProvider = new JsonRpcProvider(
      {
        url: fork.forkUrl,
        timeout: this.options.timeout,
      },
      network,
    );
    return network;
  }

  override perform(method: string, params: any): Promise<any> {
    return this.jsonRpcProvider.perform(method, params);
  }

  addBalance(address: string, amount: number | bigint) {
    return this.jsonRpcProvider.send('tenderly_setBalance', [
      [address],
      utils.hexValue(BigNumber.from(amount).toHexString()),
    ]);
  }

  setBalance(minterAddress: string, amount: number | bigint) {
    return this.jsonRpcProvider.send('tenderly_setBalance', [
      [minterAddress],
      utils.hexValue(BigNumber.from(amount).toHexString()),
    ]);
  }

  setErc20Balance(token: string, wallet: string, value: number | bigint) {
    return this.jsonRpcProvider.send('tenderly_setErc20Balance', [
      token,
      wallet,
      utils.hexValue(BigNumber.from(value).toHexString()),
    ]);
  }
}

interface TenderlyProviderOptions {
  timeout?: number;
}

export interface TenderlyConfig {
  user: string;
  project: string;
  accessKey: string;
}

export class TenderlySdk implements TestingSdk<TenderlyFork> {
  protected readonly http: ReturnType<typeof http.create>;

  constructor(private readonly config: TenderlyConfig) {
    assert(config.accessKey, 'Missing TENDERLY_ACCESS_KEY');
    assert(config.project, 'Missing TENDERLY_PROJECT');
    assert(config.user, 'Missing TENDERLY_USER');

    this.http = http.create({
      baseURL: 'https://api.tenderly.co',
      headers: {'X-Access-Key': this.config.accessKey},
    });
  }

  async createFork(input: TenderlyForkConfig): Promise<TenderlyFork> {
    return new TenderlyFork(this.config, input);
  }
}

export enum TenderlyForkStatus {
  UNINITIALIZED = 'uninitialized',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPED = 'stopped',
}

export class TenderlyFork implements TestingFork {
  protected _http: HttpClient;
  protected _forkData: TenderlyForkData | undefined;
  protected _status: TenderlyForkStatus = TenderlyForkStatus.UNINITIALIZED;

  constructor(
    public readonly tenderlyConfig: TenderlyConfig,
    public readonly forkConfig: TenderlyForkConfig,
  ) {
    this._http = http.create({
      baseURL: 'https://api.tenderly.co',
      headers: {'X-Access-Key': this.tenderlyConfig.accessKey},
    });
  }

  async start() {
    if (this._status === TenderlyForkStatus.STARTED) return;
    if (this._status === TenderlyForkStatus.STARTING) return;
    if (this._status === TenderlyForkStatus.STOPPED) {
      throw new Error(`Fork ${this.forkId} already stopped`);
    }
    this._status = TenderlyForkStatus.STARTING;
    const network = getNetwork(this.forkConfig.chainKey);
    const {data} = await this._http.post<TenderlyForkData>(`${this.projectUri}/fork`, {
      network_id: network.nativeChainId,
      chain_config: {
        chain_id: network.nativeChainId,
      },
    });
    this._forkData = data;
    this._status = TenderlyForkStatus.STARTED;
  }

  async stop() {
    assert(this.forkId, 'Fork not started');
    this._status = TenderlyForkStatus.STOPPED;
    await this._http.delete(`${this.projectUri}/fork/${this.forkId}`);
  }

  // getters to ensure readonly access from outside
  public get status(): TenderlyForkStatus {
    return this._status;
  }

  public get forkUrl(): string | undefined {
    if (!this.forkId) return undefined;
    return `https://rpc.tenderly.co/fork/${this.forkId}`;
  }

  public get forkData(): TenderlyForkData | undefined {
    return this._forkData;
  }

  public get forkId(): string | undefined {
    return this.forkData?.simulation_fork.id;
  }

  protected get projectUri(): string {
    return `/api/v1/account/${this.tenderlyConfig.user}/project/${this.tenderlyConfig.project}`;
  }
}

export interface TenderlyForkConfig {
  chainKey: ChainKey;
}

interface TenderlyForkData {
  simulation_fork: {
    id: string;
    project_id: string;
    network_id: string;
    block_number: number;
    transaction_index: number;
    chain_config: ChainConfig;
    fork_config: any;
    created_at: string;
    accounts: Record<string, string>;
    current_block_number: number;
    shared: boolean;
  };
}

export interface ChainConfig {
  type: string;
  chain_id: number;
}

// https://docs.tenderly.co/supported-networks-and-languages
export const tenderlyChains: ChainKey[] = [
  'ethereum',
  'mainnet',
  'sepolia',
  'goerli',
  'holesky',
  'polygon',
  'mumbai',
  'optimism',
  'optimism-goerli',
  'base',
  'base-goerli',
  'base-sepolia',
  'optimism-sepolia',
  'arbitrum',
  'arbitrum-nova',
  'arbitrum-sepolia',
  'arbitrum-goerli',
  'boba',
  'boba-goerli',
  'boba-bnb',
  'boba-bnb-testnet',
  'bsc',
  'bsc-testnet',
  'avalanche',
  'fuji',
  'linea',
  'linea-goerli',
  'fantom',
  'fantom-testnet',
  'moonbeam',
  'moonriver',
  'cronos',
  'cronos-testnet',
  'gnosis',
  'rsk',
  'rsk-testnet',
  'zora',
  'zora-testnet',
  'zora-sepolia',
  'mantle',
  'blast',
];

export const createTenderlyProviderFactory = (tenderlySdk: TenderlySdk) => {
  const providers: Map<ChainKey, TenderlyProxyProvider> = new Map();
  const providerFactory: ProviderFactory<TenderlyProxyProvider> = (chainKey: ChainKey) => {
    const existingProvider = providers.get(chainKey);
    if (existingProvider) return existingProvider;
    const createdProvider = new TestingProxyProvider(createTenderlyProvider(chainKey));
    providers.set(chainKey, createdProvider);
    return createdProvider;
  };
  return providerFactory;

  function createTenderlyProvider(chainKey: ChainKey): Promise<TenderlyProvider> {
    return tenderlySdk.createFork({chainKey}).then((fork) => new TenderlyProvider(fork));
  }
};

type TenderlyProxyProvider = TestingProxyProvider<TenderlyProvider>;
