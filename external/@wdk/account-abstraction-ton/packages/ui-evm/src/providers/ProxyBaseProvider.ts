import {BaseProvider, type Network} from '@ethersproject/providers';

export class ProxyBaseProvider<TProvider extends BaseProvider> extends BaseProvider {
  constructor(protected providerPromise: Promise<TProvider>) {
    super('any');
  }

  override async detectNetwork(): Promise<Network> {
    const provider = await this.providerPromise;
    return provider.detectNetwork();
  }

  override async perform(method: string, params: any): Promise<any> {
    const provider = await this.providerPromise;
    return provider.perform(method, params);
  }
}
