import {JsonRpcBatchProvider, type Network as EthersNetwork} from '@ethersproject/providers';

// caching network for performance reasons
// we know in this case that underlying backend won't change chainId
// see:
// - https://github.com/ethers-io/ethers.js/issues/901
// - https://github.com/ethers-io/ethers.js/commit/c53864de0af55dd8ec8ca5681e78da380d85250a

type OnErrorCallback = (error: unknown, provider: StaticJsonRpcBatchProvider) => void;

export class StaticJsonRpcBatchProvider extends JsonRpcBatchProvider {
  private _onError?: OnErrorCallback;

  async detectNetwork(): Promise<EthersNetwork> {
    let network = this.network;
    if (network == null) {
      // After this call completes, network is defined
      network = await super._ready();
    }
    return network;
  }

  send(method: string, params: Array<any>) {
    const response = super.send(method, params);
    response.catch((error) => {
      this._onError?.(error, this);
    });
    return response;
  }

  onError(handler: OnErrorCallback) {
    this._onError = handler;
  }
}
