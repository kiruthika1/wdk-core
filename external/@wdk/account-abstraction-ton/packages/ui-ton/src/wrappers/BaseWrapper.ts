import {
  Address,
  Builder,
  Cell,
  Contract,
  ContractProvider,
  SendMode,
  Sender,
  SenderArguments,
  beginCell,
} from '@ton/core';

export interface SendRequestOptions {
  value: number | bigint | string;
  bounce?: boolean;
  sendMode?: SendMode;
  queryId?: number | bigint;
  withInit?: boolean;
}

export abstract class BaseWrapper implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: {code: Cell; data: Cell},
  ) {}

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint | string): Promise<void> {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendRequest(
    provider: ContractProvider,
    via: Sender,
    request: SenderArguments,
  ): Promise<void> {
    return provider.internal(via, {
      value: request.value,
      sendMode: request.sendMode ?? undefined,
      body: request.body,
      bounce: request.bounce,
    });
  }

  async getDeployed(provider: ContractProvider): Promise<boolean> {
    const state = await provider.getState();
    return state.state.type !== 'uninit';
  }

  buildSenderArguments(body: Cell, opts: SendRequestOptions): SenderArguments {
    return {
      value: BigInt(opts.value),
      to: this.address,
      bounce: opts.bounce ?? true,
      body,
      init: opts.withInit === true ? this.init : undefined,
      sendMode: opts.sendMode ?? SendMode.PAY_GAS_SEPARATELY,
    } satisfies SenderArguments;
  }

  beginMessage(opcode: number | bigint, queryId?: number | bigint): Builder {
    const randomQueryId = Math.floor(Math.random() * 100000000000);
    return beginCell()
      .storeUint(opcode, 32)
      .storeUint(queryId ?? randomQueryId, 64);
  }
}
