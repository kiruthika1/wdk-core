import {
  Address,
  Cell,
  Contract,
  ContractProvider,
  SendMode,
  Sender,
  Slice,
  beginCell,
  contractAddress,
} from '@ton/core';

export interface walletConfig {
  owner_address: Address;
  jetton_master_address: Address;
}

export function walletConfigToCell(config: walletConfig): Cell {
  return beginCell()
    .storeUint(0, 4)
    .storeCoins(0)
    .storeAddress(config.owner_address)
    .storeAddress(config.jetton_master_address)
    .endCell();
}

export class UsdtWallet implements Contract {
  static readonly OPCODES = {
    TRANSFER: 0xf8a7ea5,
  };

  constructor(
    readonly address: Address,
    readonly init?: {code: Cell; data: Cell},
  ) {}

  static createFromAddress(address: Address): UsdtWallet {
    return new UsdtWallet(address);
  }

  static createFromConfig(config: walletConfig, code: Cell, workchain = 0): UsdtWallet {
    const data = walletConfigToCell(config);
    const init = {code, data};
    return new UsdtWallet(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint): Promise<void> {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async buildTransfer(
    provider: ContractProvider,
    opts: {
      value: bigint;
      fromAddress?: Address;
      toAddress: Address;
      queryId?: number;
      fwdAmount: bigint;
      jettonAmount: bigint;
    } & (
      | {
          forwardPayload?: Cell | Slice | null;
        }
      | {
          comment: string;
        }
    ),
  ) {
    const builder = beginCell()
      .storeUint(UsdtWallet.OPCODES.TRANSFER, 32)
      .storeUint(opts.queryId ?? 69, 64)
      .storeCoins(opts.jettonAmount)
      .storeAddress(opts.toAddress)
      .storeAddress(opts.fromAddress)
      .storeUint(0, 1)
      .storeCoins(opts.fwdAmount);

    if ('comment' in opts) {
      const commentPayload = beginCell().storeUint(0, 32).storeStringTail(opts.comment).endCell();

      builder.storeBit(1);
      builder.storeRef(commentPayload);
    } else {
      if (opts.forwardPayload instanceof Slice) {
        builder.storeBit(0);
        builder.storeSlice(opts.forwardPayload);
      } else if (opts.forwardPayload instanceof Cell) {
        builder.storeBit(1);
        builder.storeRef(opts.forwardPayload);
      } else {
        builder.storeBit(0);
      }
    }
    return builder.endCell();
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint;
      toAddress: Address;
      queryId?: number;
      fwdAmount: bigint;
      jettonAmount: bigint;
    } & (
      | {
          forwardPayload?: Cell | Slice | null;
        }
      | {
          comment: string;
        }
    ),
  ): Promise<void> {
    const body = await this.buildTransfer(provider, {
      ...opts,
      fromAddress: via.address,
    });

    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: body,
    });
  }

  async getData(provider: ContractProvider): Promise<{
    balance: bigint;
    owner_address: Address;
    jetton_master_address: Address;
    wallet_code: Cell;
  }> {
    const {stack} = await provider.get('get_wallet_data', []);
    return {
      balance: stack.readBigNumber(),
      owner_address: stack.readAddress(),
      jetton_master_address: stack.readAddress(),
      wallet_code: stack.readCell(),
    };
  }

  async getStatus(provider: ContractProvider): Promise<number> {
    const result = await provider.get('get_status', []);
    return result.stack.readNumber();
  }

  async getBalance(provider: ContractProvider): Promise<bigint> {
    const state = await provider.getState();
    return state.balance;
  }

  async getUsdtBalance(provider: ContractProvider): Promise<bigint> {
    try {
      const res = await this.getData(provider);
      return res.balance;
    } catch (e) {
      // If non-active we assume it's uninitialized and the balance == 0.
      // Doesn't work if the contract state gets frozen and compressed
      if ((e as Error).message === 'Trying to run get method on non-active contract') {
        return 0n;
      } else {
        throw e;
      }
    }
  }
}
