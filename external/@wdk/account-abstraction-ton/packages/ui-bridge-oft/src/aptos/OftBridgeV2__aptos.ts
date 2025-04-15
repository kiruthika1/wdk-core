import {createTransaction, type GetAptosClientFunction} from '@wdk-account-abstraction-ton/ui-aptos';
import type {
  BridgeApi,
  GetRouteInput,
  GetRouteResult,
  ResolvedRoute,
  BridgeOptions,
  GetOptionsInput,
  TransferInput,
  GetDurationInput,
  GetDurationResult,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v2';
import {
  type Currency,
  CurrencyAmount,
  MaxUint256,
  type ChainKey,
  removeDust,
  castCurrencyAmountUnsafe,
  MessageFee,
  type Transaction,
  type FeeQuote,
  isAptosChainKey,
  isEvmChainKey,
} from '@wdk-account-abstraction-ton/ui-core';
import type {BCS, Types} from 'aptos';
import type {OftBridgeConfig} from '../types';
import {getDeployment, tryGetDeployment} from '../utils';
import {AddressOne, addressToBytes32} from '@wdk-account-abstraction-ton/ui-evm';
import {
  getMinDstGas,
  getMessageFee,
  isErrorOfApiError,
  buildDefaultAdapterParams,
  buildAirdropAdapterParams,
} from '@wdk-account-abstraction-ton/ui-aptos';
import type {AccountsConfig} from './types';
import {getAccount, getOftAddress, getTypeAddress, sendCoinPayload} from './utils';

const SEND_PAYLOAD_LENGTH = 41;

export class OftBridgeV2__aptos implements BridgeApi<unknown> {
  constructor(
    protected config: OftBridgeConfig,
    protected accounts: AccountsConfig,
    protected getClient: GetAptosClientFunction,
  ) {}

  async getDuration(input: GetDurationInput): Promise<GetDurationResult> {
    return {estimated: 0};
  }

  async getOptions(input: GetOptionsInput): Promise<BridgeOptions> {
    return {options: [{mode: 'taxi'}]};
  }

  async transfer(
    input: TransferInput & {dstNativeAmount: CurrencyAmount},
  ): Promise<Transaction<unknown>> {
    const path = getPath(input);
    const client = this.getClient(input.srcChainKey);
    const minDstGas = await this.getMinDstGas(path);
    const messageFee = await this.getMessageFee(path, {
      minDstGas,
      // dstNativeAddress: input.dstAddress,
      dstNativeAddress: getDstAddressForQuote(input.dstChainKey),
      dstNativeAmount: input.dstNativeAmount.toBigInt(),
    });
    const minAmountLD = castCurrencyAmountUnsafe(input.dstAmountMin, input.srcToken);

    const adapterParams = input.dstNativeAmount.equalTo(0)
      ? buildDefaultAdapterParams(minDstGas)
      : buildAirdropAdapterParams(minDstGas, input.dstNativeAmount.toBigInt(), input.dstAddress);

    const dstEid = getDeployment(input.dstChainKey, this.config).eid;
    const dstAddress = addressToBytes32(input.dstAddress);
    const msgLibParams = new Uint8Array(0);
    const accounts = this.accounts[input.srcChainKey];
    const oftType = getOftAddress(input.srcChainKey, this.config);
    const entryFunctionPayload = sendCoinPayload(
      accounts,
      oftType,
      dstEid,
      dstAddress,
      input.srcAmount.toBigInt(),
      minAmountLD.toBigInt(),
      messageFee.nativeFee.toBigInt(),
      0n,
      adapterParams,
      msgLibParams,
    );
    return createTransaction(entryFunctionPayload, {client});
  }
  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean {
    return Boolean(
      isAptosChainKey(srcToken.chainKey) &&
        tryGetDeployment(srcToken.chainKey, this.config)?.token.equals(srcToken) &&
        tryGetDeployment(dstToken.chainKey, this.config)?.token.equals(dstToken),
    );
  }

  public async getGlobalStore(chainKey: string): Promise<Types.MoveResource> {
    const client = this.getClient(chainKey);
    const oftType = getOftAddress(chainKey, this.config);
    const address = getTypeAddress(oftType);
    const module = `${getAccount(this.accounts, chainKey, 'layerzero_apps')}::oft`;
    return client.getAccountResource(address, `${module}::GlobalStore<${oftType}>`);
  }

  public async getMinDstGas({srcChainKey, dstChainKey}: Path): Promise<BCS.Uint64> {
    const dstEid = getDeployment(dstChainKey, this.config).eid;
    const oftType = getOftAddress(srcChainKey, this.config);
    const minDstGas = await getMinDstGas(
      this.getClient(srcChainKey),
      this.accounts[srcChainKey],
      getTypeAddress(oftType),
      dstEid,
      BigInt(PacketType.SEND),
    );
    return BigInt(minDstGas);
  }

  public async getFeeBp({srcChainKey, dstChainKey}: Path): Promise<bigint> {
    const client = this.getClient(srcChainKey);
    const dstEid = getDeployment(dstChainKey, this.config).eid;
    const resource = await this.getGlobalStore(srcChainKey);
    const {fee_config} = resource.data as GlobalStore;

    try {
      return await client.getTableItem(fee_config.chain_id_to_fee_bp.handle, {
        key_type: `u64`,
        value_type: `u64`,
        key: dstEid.toString(),
      });
    } catch (e) {
      if (isErrorOfApiError(e, 404)) {
        return BigInt(fee_config.default_fee_bp);
      }
      throw e;
    }
  }

  public async getMessageFee(
    {srcChainKey, dstChainKey}: Path,
    {
      dstNativeAmount,
      minDstGas,
      dstNativeAddress,
    }: {dstNativeAmount: bigint; minDstGas: bigint; dstNativeAddress: string},
  ): Promise<FeeQuote> {
    const oftType = getOftAddress(srcChainKey, this.config);
    const uaAddress = getTypeAddress(oftType);
    const dstEid = getDeployment(dstChainKey, this.config).eid;
    const adapterParams =
      dstNativeAmount === 0n
        ? buildDefaultAdapterParams(minDstGas)
        : buildAirdropAdapterParams(minDstGas, dstNativeAmount, dstNativeAddress);

    const nativeFee = await getMessageFee(
      this.getClient(srcChainKey),
      this.accounts[srcChainKey],
      uaAddress,
      dstEid,
      adapterParams,
      SEND_PAYLOAD_LENGTH,
    );

    return MessageFee.from(srcChainKey, {
      nativeFee: nativeFee,
      zroFee: 0n,
    });
  }

  public async getRoute(input: GetRouteInput): Promise<GetRouteResult> {
    const path = getPath(input);
    const [minDstGas, feeBp] = await Promise.all([
      this.getMinDstGas(path),
      // don't hit the network if fee is disabled
      this.config.fee === false ? 0n : this.getFeeBp(path),
    ]);

    // need to quote message with 0 and provided dstNativeAmount to get
    // actual message fee

    const [endpointFee0, endpointFee1, duration] = await Promise.all([
      this.getMessageFee(path, {
        minDstGas,
        dstNativeAddress: getDstAddressForQuote(path.dstChainKey),
        dstNativeAmount: 0n,
      }),
      // quoting to warm up cache
      this.getMessageFee(path, {
        minDstGas,
        dstNativeAddress: getDstAddressForQuote(path.dstChainKey),
        dstNativeAmount: input.dstNativeAmount.toBigInt(),
      }),
      this.getDuration(input),
    ]);

    const gasCost = endpointFee1.nativeFee.subtract(endpointFee0.nativeFee);
    const srcAmount = removeDust(input.srcAmount, this.config.sharedDecimals);
    const feeAmount = srcAmount.multiply(feeBp).divide(10000);
    const dstAmountLd = srcAmount.subtract(feeAmount);
    const dstAmount = castCurrencyAmountUnsafe(dstAmountLd, input.dstToken);
    const srcAmountMax = CurrencyAmount.fromBigInt(input.srcToken, MaxUint256);
    const messageFee = endpointFee0;

    const route: ResolvedRoute = {
      mode: 'taxi',
      allowance: getMaxAllowance(input.srcToken),
      dstAddress: input.dstAddress,
      dstAmount,
      dstAmountMin: dstAmount,
      dstNativeAmount: input.dstNativeAmount,
      dstToken: input.dstToken,
      duration,
      error: undefined,
      gasCost,
      messageFee,
      option: {
        mode: 'taxi',
      },
      srcAddress: input.srcAddress,
      srcAmount: srcAmount,
      srcAmountMax: srcAmountMax,
      srcToken: input.srcToken,
    };

    return route;
  }
}

// returns same address so it can be cached
function getDstAddressForQuote(chainKey: ChainKey) {
  if (isEvmChainKey(chainKey)) {
    return AddressOne;
  }
  throw new Error(`Unsupported chain key: ${chainKey}`);
}

function getPath(input: {srcToken: Currency; dstToken: Currency}) {
  return {
    srcChainKey: input.srcToken.chainKey,
    dstChainKey: input.dstToken.chainKey,
  };
}

type Path = {srcChainKey: ChainKey; dstChainKey: ChainKey};

function getMaxAllowance(token: Currency) {
  return CurrencyAmount.fromRawAmount(token, MaxUint256);
}

interface GlobalStore {
  proxy: boolean;
  ld2sd_rate: string;
  fee_config: FeeConfig;
  custom_adapter_params: boolean;
}

interface FeeConfig {
  fee_owner: string;
  default_fee_bp: string;
  chain_id_to_fee_bp: {
    handle: string;
  };
}

enum PacketType {
  SEND = 0,
}
