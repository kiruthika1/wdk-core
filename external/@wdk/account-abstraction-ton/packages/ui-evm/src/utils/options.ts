import {ethers} from 'ethers';
import {assert as invariant} from '@wdk-account-abstraction-ton/ui-core';
import {hexZeroPadTo32, trim0x} from './utils';

// gasLimit input type
export type GasLimit = string | number | bigint;

// native drop input type
export type NativeDrop = string | number | bigint;

/**
 * Enumerates the supported option types.
 */
export enum OptionType {
  /**
   * Allows the specification of the gas allowance for the remote executor transaction, measured in destination gas
   * units.
   *
   * Format:
   * bytes  [2     32      ]
   * fields [type  extraGas]
   */
  TYPE_1 = 1,

  /**
   * Combines the functionality of TYPE_1 along with destination gas drop to a remote address.
   *
   * Format:
   * bytes  [2     32        32            bytes[]         ]
   * fields [type  extraGas  dstNativeAmt  dstNativeAddress]
   */
  TYPE_2 = 2,

  /**
   * EndpointV2 specific options.
   */
  TYPE_3 = 3,
}

const MAX_UINT_128 = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffff');

/**
 * Builds OptionsType.TYPE_1.
 *
 * @param {GasLimit} _extraGas The gas allowance for the remote executor transaction, measured in destination gas units.
 */
export function optionsType1(_extraGas: GasLimit): string {
  const extraGas = ethers.BigNumber.from(_extraGas);
  invariant(extraGas.lte(MAX_UINT_128), 'extraGas should be less than MAX_UINT_128');
  return ethers.utils.solidityPack(['uint16', 'uint256'], [OptionType.TYPE_1, extraGas]);
}

/**
 * Builds OptionsType.TYPE_2.
 *
 * @param {GasLimit} _extraGas The gas allowance for the remote executor transaction, measured in destination gas units.
 * @param {NativeDrop} _dstNativeAmt The amount of native token to be sent to the destination chain.
 * @param {string} _dstNativeAddress The destination address of _dstNativeAmt.
 */
export function optionsType2(
  _extraGas: GasLimit,
  _dstNativeAmt: NativeDrop,
  _dstNativeAddress: string,
): string {
  const extraGas = ethers.BigNumber.from(_extraGas);
  invariant(extraGas.lte(MAX_UINT_128), 'extraGas should be less than MAX_UINT_128');
  const dstNativeAmt = ethers.BigNumber.from(_dstNativeAmt);
  invariant(dstNativeAmt.lte(MAX_UINT_128), 'dstNativeAmt should be less than MAX_UINT_128');
  return ethers.utils.solidityPack(
    ['uint16', 'uint256', 'uint256', 'bytes'],
    [
      OptionType.TYPE_2,
      ethers.BigNumber.from(extraGas),
      ethers.BigNumber.from(dstNativeAmt),
      _dstNativeAddress,
    ],
  );
}

/**
 * Enumerates the supported worker IDs.
 */
export enum WorkerId {
  EXECUTOR = 1,
  VERIFIER = 2,
  TREASURY = 255,
}

export type WorkerOptions = {
  workerId: number; // uint8
  options: Option[]; // toBytes: num(uint8),[type(uint8),size(uint16),data],[type(uint8),size(uint16),data],[type(uint8),size(uint16),data]...
};

export type Option = {
  type: number; // uint8
  params: string; // bytes
};

export type VerifierOption = Option & {
  index: number; // uint8
};

/**
 * Enumerates the supported executor option types.
 */
export enum ExecutorOptionType {
  LZ_RECEIVE = 1,
  NATIVE_DROP = 2,
  COMPOSE = 3,
  ORDERED = 4,
}

/**
 * Enumerates the supported verifier option types.
 */
export enum VerifierOptionType {
  PRECRIME = 1,
}

/**
 * Options builder, available only for EndpointV2.
 */
export class Options {
  protected workerOptions: WorkerOptions[] = [];

  // dissuade public instantiation
  protected constructor() {}

  /**
   * Create a new options instance.
   */
  public static newOptions(): Options {
    return new Options();
  }

  /**
   * Create an options instance from a hex string.
   * @param {string} optionsHex The hex string to decode.
   */
  public static fromOptions(optionsHex: string): Options {
    const options = new Options();
    const optionsBytes = ethers.utils.arrayify(optionsHex);
    // 0-2 bytes is options type
    const optionsType = ethers.BigNumber.from(optionsBytes.slice(0, 2)).toNumber();
    if (optionsType === OptionType.TYPE_3) {
      let cursor = 2;
      while (cursor < optionsBytes.byteLength) {
        const workerId = ethers.BigNumber.from(optionsBytes.slice(cursor, cursor + 1)).toNumber();
        cursor += 1;

        const size = ethers.BigNumber.from(optionsBytes.slice(cursor, cursor + 2)).toNumber();
        cursor += 2;

        if (workerId === WorkerId.EXECUTOR) {
          const optionType = ethers.BigNumber.from(
            optionsBytes.slice(cursor, cursor + 1),
          ).toNumber();
          cursor += 1;
          const params = optionsBytes.slice(cursor, cursor + size - 1);
          cursor += size - 1;
          options.addOption(workerId, {type: optionType, params: ethers.utils.hexlify(params)});
        } else if (workerId === WorkerId.VERIFIER) {
          const verifierIdx = ethers.BigNumber.from(
            optionsBytes.slice(cursor, cursor + 1),
          ).toNumber();
          cursor += 1;
          const optionType = ethers.BigNumber.from(
            optionsBytes.slice(cursor, cursor + 1),
          ).toNumber();
          cursor += 1;
          const params = optionsBytes.slice(cursor, cursor + size - 2);
          cursor += size - 2;
          options.addOption(workerId, <VerifierOption>{
            type: optionType,
            index: verifierIdx,
            params: ethers.utils.hexlify(params),
          });
        }
        // TODO - other workerId
      }
    } else if (optionsType === OptionType.TYPE_2) {
      const extraGas = ethers.BigNumber.from(optionsBytes.slice(2, 34)).toBigInt();
      const dstNativeAmt = ethers.BigNumber.from(optionsBytes.slice(34, 66)).toBigInt();
      const dstNativeAddress = ethers.utils.hexlify(
        optionsBytes.slice(66, optionsBytes.byteLength),
      );
      options
        .addExecutorLzReceiveOption(extraGas)
        .addExecutorNativeDropOption(dstNativeAmt, dstNativeAddress);
    } else if (optionsType === OptionType.TYPE_1) {
      const extraGas = ethers.BigNumber.from(optionsBytes.slice(2, 34)).toBigInt();
      options.addExecutorLzReceiveOption(extraGas);
    }

    return options;
  }

  /**
   * Add ExecutorOptionType.LZ_RECEIVE option.
   * @param {GasLimit} gasLimit
   * @param {NativeDrop} nativeDrop
   */
  public addExecutorLzReceiveOption(gasLimit: GasLimit, nativeDrop: NativeDrop = 0): Options {
    const gasLimitBN = ethers.BigNumber.from(gasLimit);
    invariant(gasLimitBN.lte(MAX_UINT_128), "gasLimit shouldn't be greater than MAX_UINT_128");
    const nativeDropBN = ethers.BigNumber.from(nativeDrop);
    invariant(nativeDropBN.lte(MAX_UINT_128), "value shouldn't be greater than MAX_UINT_128");
    this.addOption(WorkerId.EXECUTOR, {
      type: ExecutorOptionType.LZ_RECEIVE,
      params: nativeDropBN.eq(0)
        ? ethers.utils.solidityPack(['uint128'], [gasLimitBN])
        : ethers.utils.solidityPack(['uint128', 'uint128'], [gasLimitBN, nativeDropBN]),
    });
    return this;
  }

  /**
   * Add ExecutorOptionType.NATIVE_DROP option.
   * @param {NativeDrop} nativeDrop
   * @param {string} receiver
   */
  public addExecutorNativeDropOption(nativeDrop: NativeDrop, receiver: string): Options {
    const amountBN = ethers.BigNumber.from(nativeDrop);
    invariant(amountBN.lte(MAX_UINT_128), "nativeDrop shouldn't be greater than MAX_UINT_128");
    this.addOption(WorkerId.EXECUTOR, {
      type: ExecutorOptionType.NATIVE_DROP,
      params: ethers.utils.solidityPack(
        ['uint128', 'bytes32'],
        [amountBN, hexZeroPadTo32(receiver)],
      ),
    });
    return this;
  }

  /**
   * Add ExecutorOptionType.COMPOSE option.
   * @param {number} index
   * @param {GasLimit} gasLimit
   * @param {NativeDrop} nativeDrop
   */
  public addExecutorComposeOption(
    index: number,
    gasLimit: GasLimit,
    nativeDrop: NativeDrop = 0,
  ): Options {
    const gasLimitBN = ethers.BigNumber.from(gasLimit);
    invariant(gasLimitBN.lte(MAX_UINT_128), "gasLimit shouldn't be greater than MAX_UINT_128");
    const nativeDropBN = ethers.BigNumber.from(nativeDrop);
    invariant(nativeDropBN.lte(MAX_UINT_128), "nativeDrop shouldn't be greater than MAX_UINT_128");
    const option = nativeDropBN.gt(0)
      ? {
          type: ExecutorOptionType.COMPOSE,
          params: ethers.utils.solidityPack(
            ['uint16', 'uint128', 'uint128'],
            [index, gasLimitBN, nativeDropBN],
          ),
        }
      : {
          type: ExecutorOptionType.COMPOSE,
          params: ethers.utils.solidityPack(['uint16', 'uint128'], [index, gasLimitBN]),
        };

    this.addOption(WorkerId.EXECUTOR, option);
    return this;
  }

  /**
   * Add ExecutorOptionType.ORDERED option.
   */
  public addExecutorOrderedExecutionOption(): Options {
    this.addOption(WorkerId.EXECUTOR, {
      type: ExecutorOptionType.ORDERED,
      params: '0x',
    });
    return this;
  }

  /**
   * Add VerifierOptionType.PRECRIME option.
   * @param {number} verifierIdx
   */
  public addVerifierPrecrimeOption(verifierIdx: number): Options {
    this.addOption(WorkerId.VERIFIER, <VerifierOption>{
      type: VerifierOptionType.PRECRIME,
      index: verifierIdx,
      params: '0x',
    });
    return this;
  }

  /**
   * Serialize Options to hex string.
   */
  public toHex(): string {
    // output encoded hex, type(uint16)
    let hex = ethers.utils.solidityPack(['uint16'], [OptionType.TYPE_3]);
    this.workerOptions.forEach((w) => {
      for (const option of w.options) {
        if (w.workerId === WorkerId.EXECUTOR) {
          hex += trim0x(
            ethers.utils.solidityPack(
              ['uint8', 'uint16', 'uint8', 'bytes'],
              [w.workerId, trim0x(option.params).length / 2 + 1, option.type, option.params],
            ),
          );
        } else if (w.workerId === WorkerId.VERIFIER) {
          const verifierOption = option as VerifierOption;
          hex += trim0x(
            ethers.utils.solidityPack(
              ['uint8', 'uint16', 'uint8', 'uint8', 'bytes'],
              [
                w.workerId,
                trim0x(option.params).length / 2 + 2,
                verifierOption.index,
                verifierOption.type,
                verifierOption.params,
              ],
            ),
          );
        }
        // TODO other workerId
      }
    });
    return hex;
  }

  /**
   * Serialize Options to Uint8Array.
   */
  public toBytes(): Uint8Array {
    return ethers.utils.arrayify(this.toHex());
  }

  private addOption(workerId: number, option: Option): void {
    const worker = this.workerOptions.find((w) => w.workerId === workerId);
    if (worker) {
      worker.options.push(option);
    } else {
      this.workerOptions.push({workerId, options: [option]});
    }
  }

  /**
   * Decode ExecutorOptionType.LZ_RECEIVE option.  Returns undefined if the option is not present.
   */
  public decodeExecutorLzReceiveOption(): {gas: bigint; value: bigint} | undefined {
    const options = this.findOptions(WorkerId.EXECUTOR, ExecutorOptionType.LZ_RECEIVE) as Option[];
    if (!options || options.length === 0) {
      return;
    }
    let totalGas = ethers.BigNumber.from(0).toBigInt();
    let totalValue = ethers.BigNumber.from(0).toBigInt();
    for (const option of options) {
      const buffer = Buffer.from(trim0x(option.params), 'hex');
      const gas = ethers.BigNumber.from(buffer.subarray(0, 16)).toBigInt();
      if (buffer.length === 16) {
        return {gas, value: ethers.BigNumber.from(0).toBigInt()};
      }
      const value = ethers.BigNumber.from(buffer.subarray(16, 32)).toBigInt();
      totalGas = totalGas + gas;
      totalValue = totalValue + value;
    }

    return {gas: totalGas, value: totalValue};
  }

  /**
   * Decode ExecutorOptionType.NATIVE_DROP options.  Returns undefined if the options is not present.
   */
  public decodeExecutorNativeDropOption(): {amount: bigint; receiver: string}[] {
    const options = this.findOptions(WorkerId.EXECUTOR, ExecutorOptionType.NATIVE_DROP) as Option[];
    if (!options || options.length === 0) {
      return [];
    }

    const results = options.reduce(
      (acc: {[key: string]: {amount: bigint; receiver: string}}, cur: Option) => {
        const buffer = Buffer.from(trim0x(cur.params), 'hex');
        const amount = ethers.BigNumber.from(buffer.subarray(0, 16)).toBigInt();
        const receiver = ethers.utils.hexlify(buffer.subarray(16, 48));
        if (acc[receiver]) {
          acc[receiver]['amount'] = acc[receiver].amount + amount;
        } else {
          acc[receiver] = {amount, receiver};
        }
        return acc;
      },
      {},
    );
    return Object.values(results);
  }

  /**
   * Decode ExecutorOptionType.COMPOSE options.  Returns undefined if the options is not present.
   */
  public decodeExecutorComposeOption(): {index: number; gas: bigint; value: bigint}[] {
    const options = this.findOptions(WorkerId.EXECUTOR, ExecutorOptionType.COMPOSE) as Option[];
    if (!options || options.length === 0) {
      return [];
    }
    const results = options.reduce(
      (acc: {[key: number]: {index: number; gas: bigint; value: bigint}}, cur: Option) => {
        const buffer = Buffer.from(trim0x(cur.params), 'hex');
        const index = ethers.BigNumber.from(buffer.subarray(0, 2)).toNumber();
        const gas = ethers.BigNumber.from(buffer.subarray(2, 18)).toBigInt();
        const value = (
          buffer.length === 34
            ? ethers.BigNumber.from(buffer.subarray(18, 34))
            : ethers.BigNumber.from(0)
        ).toBigInt();
        if (acc[index]) {
          acc[index]['gas'] = acc[index].gas + gas;
          acc[index]['value'] = acc[index].value + value;
        } else {
          acc[index] = {index, gas, value};
        }
        return acc;
      },
      {},
    );
    return Object.values(results);
  }

  /**
   * Decode ExecutorOptionType.ORDERED options.  Returns undefined if the options is not present.
   */
  public decodeExecutorOrderedExecutionOption(): boolean {
    const option = this.findOptions(WorkerId.EXECUTOR, ExecutorOptionType.ORDERED) as Option;
    return option !== undefined;
  }

  private findOptions(workerId: number, optionType: number): Option[] | Option | undefined {
    const worker = this.workerOptions.find((w) => w.workerId === workerId);
    if (worker) {
      if (optionType === ExecutorOptionType.ORDERED) {
        return worker.options.find((o) => o.type === optionType);
      }
      return worker.options.filter((o) => o.type === optionType);
    }
  }

  /**
   * Find VerifierOption by verifierIdx and optionType.  Returns undefined if the option is not present.
   * @param {number} verifierIdx
   * @param {number} optionType
   */
  public findVerifierOption(verifierIdx: number, optionType: number): VerifierOption | undefined {
    const worker = this.workerOptions.find((w) => w.workerId === WorkerId.VERIFIER);
    if (worker) {
      const opt = worker.options.find(
        (o) => o.type === optionType && (o as VerifierOption).index === verifierIdx,
      );
      if (opt) {
        return opt as VerifierOption;
      }
    }
  }
}
