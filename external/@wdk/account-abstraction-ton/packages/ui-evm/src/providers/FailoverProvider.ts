import {BaseProvider, type Network, Provider} from '@ethersproject/providers';
import {Logger} from '@ethersproject/logger';

const logger = new Logger('0.0.1');

type FailoverProviderConfig = {
  provider: BaseProvider;
};

type FailoverProviderEntry = {
  provider: BaseProvider;
  errors: any[];
};

export class FailoverProvider extends BaseProvider {
  readonly maxAttempts = 3;
  readonly providerConfigs: ReadonlyArray<FailoverProviderConfig>;
  readonly providerEntries: Map<Provider, FailoverProviderEntry>;
  readonly orderedProviderEntries: FailoverProviderEntry[];

  constructor(providers: Array<BaseProvider | FailoverProviderConfig>, network: Network) {
    super(Promise.resolve(network));

    const providerConfigs: FailoverProviderConfig[] = providers.map((providerOrConfig) => {
      if (Provider.isProvider(providerOrConfig)) {
        const config: FailoverProviderConfig = {
          provider: providerOrConfig,
        };
        return config;
      }
      const config: FailoverProviderConfig = {
        provider: providerOrConfig.provider,
      };
      return config;
    });

    const providerEntries = new Map<Provider, FailoverProviderEntry>();

    providerConfigs.forEach((config) => {
      const entry: FailoverProviderEntry = {
        provider: config.provider,
        errors: [],
      };
      providerEntries.set(config.provider, entry);
    });

    this.providerConfigs = providerConfigs;
    this.providerEntries = providerEntries;
    this.orderedProviderEntries = Array.from(providerEntries.values());
  }

  async detectNetwork(): Promise<Network> {
    return this.network;
  }

  async perform(method: string, params: {[name: string]: any}): Promise<any> {
    let attempt = 0;
    while (++attempt <= this.maxAttempts) {
      const provider = this.getProvider();
      if (attempt > 1) {
        logger.warn(`Attempt ${attempt}`, {provider});
      }
      try {
        return await provider.perform(method, params);
      } catch (error) {
        if ((error as any)?.code === 'UNPREDICTABLE_GAS_LIMIT') {
          // most likely smart contract error
          throw error;
        }
        logger.warn(`Attempt ${attempt} failed`, error);
        this.handleError(provider, error);
        if (attempt >= this.maxAttempts) {
          throw error;
        }
      }
    }
  }

  private getProvider(): BaseProvider {
    return this.orderedProviderEntries[0]!.provider;
  }

  private handleError(provider: BaseProvider, error: any): void {
    const entry = this.getEntry(provider);
    entry.errors.push(error);
    this.updateOrder();
  }

  private getEntry(provider: BaseProvider) {
    return this.providerEntries.get(provider)!;
  }

  private updateOrder() {
    const currentProvider = this.getProvider();
    // sort by least errors
    this.orderedProviderEntries.sort((a, b) => a.errors.length - b.errors.length);
    const nextProvider = this.getProvider();
    if (nextProvider !== currentProvider) {
      logger.warn(`Next provider`, {currentProvider, nextProvider});
    }
  }
}
