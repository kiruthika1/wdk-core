import {JsonRpcProvider} from '@ethersproject/providers';
import {BigNumber, ethers, utils} from 'ethers';
import {
  TestingProxyProvider,
  type TestingFork,
  type TestingProvider,
  type TestingSdk,
} from './testing';

import {type ChainKey, assert, waitFor} from '@wdk-account-abstraction-ton/ui-core';
import ERC20_ABI from './abi/ERC20.json';
import {setErc20Balance} from './utils/setErc20Balance';
import type {Anvil, CreateAnvilOptions} from '@viem/anvil';
import type {ProviderFactory} from './providerFactory';

export class AnvilProvider extends JsonRpcProvider implements TestingProvider {
  protected _started = false;

  constructor(public readonly fork: AnvilFork) {
    super(fork.forkUrl);
  }

  async startFork() {
    await this.fork.start();
  }
  async stopFork() {
    await this.fork.stop();
  }

  addBalance(address: string, amount: number | bigint) {
    return this.getBalance(address, 'latest').then((balance) => {
      const balanceBi = balance.toBigInt();
      const amountBi = BigInt(amount);
      return this.setBalance(address, balanceBi + amountBi);
    });
  }

  setBalance(address: string, amount: number | bigint) {
    return this.send('anvil_setBalance', [
      address,
      utils.hexValue(BigNumber.from(amount).toHexString()),
    ]);
  }

  getErc20Balance(contract: string, wallet: string) {
    const erc20 = new ethers.Contract(contract, ERC20_ABI, this);
    return erc20.balanceOf(wallet);
  }

  async setErc20Balance(token: string, wallet: string, value: number | bigint) {
    await setErc20Balance({token, recipient: wallet, amount: value}, this);
  }
}

export class AnvilFork implements TestingFork {
  constructor(
    protected readonly anvil: Anvil,
    anvilSdk?: AnvilSdk,
  ) {}

  async start() {
    const status = this.anvil.status;
    // todo: how to ensure anvil is ready?
    if (status === 'listening') return;
    if (status === 'starting') return;
    await this.anvil.start();
    await waitFor(() => isAnvilReady(getAnvilUrl(this.anvil)));
  }

  async stop() {
    await this.anvil.stop();
  }

  get forkUrl() {
    return getAnvilUrl(this.anvil);
  }
}

interface AnvilSdkOptions {
  log?: boolean;
  chains: Record<ChainKey, CreateAnvilOptions>;
}

export class AnvilSdk implements TestingSdk<AnvilFork> {
  protected logger: typeof console | undefined = undefined;
  constructor(public readonly options: AnvilSdkOptions) {
    if (this.options.log) this.logger = console;
  }

  protected getAnvilOptions(chainKey: ChainKey) {
    const config = this.options.chains[chainKey];
    assert(config, `No Anvil chain config found for chainKey: ${chainKey}`);
    return config;
  }

  async createFork(input: {chainKey: ChainKey}) {
    this.logger?.log(`Creating Anvil fork for chainKey: ${input.chainKey}`);
    const anvilOptions = this.getAnvilOptions(input.chainKey);
    const {default: getPort} = await import('get-port');
    const {createAnvil} = await import('@viem/anvil');
    const port = await (anvilOptions.port ?? getPort());
    const anvil = createAnvil({
      ...anvilOptions,
      port,
    });
    return new AnvilFork(anvil);
  }
}

type AnvilProxyProvider = TestingProxyProvider<AnvilProvider>;

export const createAnvilProviderFactory = (
  anvilSdk: AnvilSdk,
): ProviderFactory<AnvilProxyProvider> => {
  const providers = new Map<ChainKey, AnvilProxyProvider>();

  return (chainKey: ChainKey) => {
    const existingProvider = providers.get(chainKey);
    if (existingProvider) return existingProvider;
    const createdProvider = new TestingProxyProvider(createAnvilProvider(chainKey));
    providers.set(chainKey, createdProvider);
    return createdProvider;
  };

  async function createAnvilProvider(chainKey: ChainKey): Promise<AnvilProvider> {
    const fork = await anvilSdk.createFork({chainKey});
    const anvilProvider = new AnvilProvider(fork);
    return anvilProvider;
  }
};

function getAnvilUrl(anvil: Anvil) {
  return `http://${anvil.host}:${anvil.port}`;
}

async function isAnvilReady(anvilUrl: string) {
  const provider = new JsonRpcProvider(anvilUrl);
  return provider.getBlock('latest').then(() => true);
}
