import {Cell, ContractProvider, TupleItem, TupleReader} from '@ton/core';
import {Address} from '@ton/ton';
import {BaseWrapper} from './BaseWrapper';

export class TonContractWrapper extends BaseWrapper {
  static create(address: Address): TonContractWrapper {
    return new TonContractWrapper(address);
  }

  async getViewFunction(
    provider: ContractProvider,
    method: string,
    args: TupleItem[],
  ): Promise<TupleReader> {
    const ret = await provider.get(method, args);
    return ret.stack;
  }

  async getGetAmountAndFee(
    provider: ContractProvider,
    totalAmount: bigint,
  ): Promise<[bigint, bigint]> {
    const args: TupleItem[] = [{type: 'int', value: totalAmount}];
    const stack = await this.getViewFunction(provider, 'getAmountAndFee', args);
    return [stack.readBigNumber(), stack.readBigNumber()];
  }

  async getLzSendMd(provider: ContractProvider, oftSendMd: Cell) {
    const args: TupleItem[] = [
      {type: 'cell', cell: oftSendMd},
      {type: 'int', value: 2n}, // Msg type. 2 is SEND_OFT
    ];
    const stack = await this.getViewFunction(provider, 'getLzSendMd', args);
    return stack.readCell();
  }

  async getGetAllCredits(
    provider: ContractProvider,
  ): Promise<[bigint, bigint, bigint, bigint, bigint]> {
    const args: TupleItem[] = [];
    const stack = await this.getViewFunction(provider, 'getAllCredits', args);

    // Arbitrum, Celo, Eth, Ton, Tron
    return [
      stack.readBigNumber(),
      stack.readBigNumber(),
      stack.readBigNumber(),
      stack.readBigNumber(),
      stack.readBigNumber(),
    ];
  }

  async parseSendInfo(
    provider: ContractProvider,
    cell: Cell,
  ): Promise<[bigint, bigint, bigint, bigint, bigint]> {
    const _dstEidOffset = 0;
    const _toOffset = _dstEidOffset + 32;
    const _minAmountOffset = _toOffset + 256;
    const _nativeFeeOffset = _minAmountOffset + 128;
    const _zroFeeOffset = _nativeFeeOffset + 128;
    const selfSlice = cell.beginParse();

    const skipTo = (offset: number) => {
      if (selfSlice.offsetBits < offset) {
        selfSlice.skip(offset - selfSlice.offsetBits);
      }
    };

    const dstEid = selfSlice.loadUintBig(32);
    // skipTo(_toOffset);
    const to = selfSlice.loadUintBig(256);
    // skipTo(_minAmountOffset);
    const minAmount = selfSlice.loadCoins();
    // skipTo(_nativeFeeOffset);
    const nativeFee = selfSlice.loadCoins();
    // skipTo(_zroFeeOffset);
    const zroFee = selfSlice.loadCoins();

    return [dstEid, to, minAmount, nativeFee, zroFee];
  }

  async getNewUsdtOFT(
    provider: ContractProvider,
    args: {
      owner: bigint;
      controllerAddress: bigint;
      eid: bigint;
      endpointCode: Cell;
      channelCode: Cell;
    },
  ): Promise<Cell> {
    const getResult = await provider.get('UsdtOFT::New', [
      {type: 'int', value: args.owner},
      {type: 'int', value: args.controllerAddress},
      {type: 'int', value: args.eid},
      {type: 'cell', cell: args.endpointCode},
      {type: 'cell', cell: args.channelCode},
    ]);
    return getResult.stack.readCell();
  }

  async getNewOFTSend(
    provider: ContractProvider,
    args: {
      dstEid: bigint;
      to: bigint;
      minAmount: bigint;
      nativeFee: bigint;
      zroFee: bigint;
      extraOptions: Cell;
      composeMessage: Cell;
    },
  ): Promise<Cell> {
    const getResult = await provider.get('OFTSend::New', [
      {type: 'int', value: args.dstEid},
      {type: 'int', value: args.to},
      {type: 'int', value: args.minAmount},
      {type: 'int', value: args.nativeFee},
      {type: 'int', value: args.zroFee},
      {type: 'cell', cell: args.extraOptions},
      {type: 'cell', cell: args.composeMessage},
    ]);
    return getResult.stack.readCell();
  }

  async createExtraOptions(
    provider: ContractProvider,
    args: {
      lzReceiveGas: bigint;
      lzReceiveValue: bigint;
      nativeDropAddress: bigint; // Hex string as number. Can be done via BigInt(address)
      nativeDropAmount: bigint;
    },
  ): Promise<Cell> {
    const getResult = await provider.get('md::OptionsV1::New', [
      {type: 'int', value: args.lzReceiveGas},
      {type: 'int', value: args.lzReceiveValue},
      {type: 'int', value: args.nativeDropAddress},
      {type: 'int', value: args.nativeDropAmount},
    ]);
    return getResult.stack.readCell();
  }
}
