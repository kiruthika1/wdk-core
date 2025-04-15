import type {
  BridgeOutput,
  GetExtraGasInput,
  GetMessageFeeInput,
  GetOutputInput,
  TransferInput,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  assert,
  type Transaction,
  Currency,
  type FeeQuote,
  CurrencyAmount,
  castCurrencyAmountUnsafe,
  getNativeCurrency,
  type ChainKey,
} from '@wdk-account-abstraction-ton/ui-core';
import {type Signer, constants, utils} from 'ethers';
import {OftBridgeBase} from './OftBridgeBase';
import {
  AddressOne,
  type ProviderFactory,
  createTransaction,
  addressToBytes32,
  serializeAdapterParams,
} from '@wdk-account-abstraction-ton/ui-evm';
import {ProxyOFTV1__factory, OFTV1__factory} from '../../typechain';
import type {OftBridgeConfig, OftBridgeFee} from '../../types';

enum PacketType {
  PT_SEND = 0,
}

export class OftBridgeV1 extends OftBridgeBase {
  constructor(
    protected providerFactory: ProviderFactory,
    public config: OftBridgeConfig,
  ) {
    super(providerFactory, config);
  }

  protected validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    assert(config.version === 1, 'Invalid config.version: is not 1');
    assert(config.fee === false, 'Invalid config.fee: is not false');
  }

  override async transfer(input: TransferInput): Promise<Transaction<Signer>> {
    this.validateInput(input);

    const {srcChainKey, dstChainKey} = input;
    const contract = this.getContractV1(srcChainKey);
    const adapterParams = serializeAdapterParams(input.adapterParams);
    const value = input.fee.nativeFee.quotient;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);

    const populatedTransaction = contract.populateTransaction.sendFrom(
      input.srcAddress,
      dstEid,
      input.dstAddress,
      input.srcAmount.quotient,
      input.dstAddress,
      constants.AddressZero,
      adapterParams,
      {value, from: input.srcAddress},
    );

    return createTransaction(populatedTransaction, {
      provider: this.providerFactory(srcChainKey),
      chainKey: srcChainKey,
    });
  }

  override async getMessageFee({
    srcToken,
    dstToken,
    adapterParams,
  }: GetMessageFeeInput): Promise<FeeQuote> {
    const srcChainKey = srcToken.chainKey;
    const dstChainKey = dstToken.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const native = getNativeCurrency(srcChainKey);

    const lzParams = serializeAdapterParams(adapterParams);
    const dstAddress = utils.hexlify(addressToBytes32(AddressOne));
    const useZro = false;
    const amount = 0;

    const contract = this.getContractV1(srcChainKey);

    const response = await contract.estimateSendFee(dstEid, dstAddress, amount, useZro, lzParams);

    const fee: FeeQuote = {
      nativeFee: CurrencyAmount.fromRawAmount(native, response.nativeFee.toBigInt()),
      zroFee: CurrencyAmount.fromRawAmount(native, response.zroFee.toBigInt()),
    };
    return fee;
  }

  override async getExtraGas({srcToken, dstToken}: GetExtraGasInput): Promise<number> {
    const srcChainKey = srcToken.chainKey;
    const dstChainKey = dstToken.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const contract = this.getContractV1(srcChainKey);
    const extraGas = await contract.minDstGasLookup(dstEid, PacketType.PT_SEND);
    return extraGas.toNumber() || this.getDefaultExtraGas(srcChainKey, dstChainKey);
  }

  override async getOutput({
    srcAmount,
    dstToken,
  }: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    const fee = srcAmount.multiply(0);
    const outputAmount = castCurrencyAmountUnsafe(srcAmount.subtract(fee), dstToken);
    return {
      fee: {bridgeFee: fee},
      dstAmount: outputAmount,
    };
  }

  protected getContractV1(chainKey: ChainKey) {
    const {oftProxy, oft} = this.getDeployment(chainKey);
    const provider = this.providerFactory(chainKey);
    if (oftProxy) {
      return ProxyOFTV1__factory.connect(oftProxy.address, provider);
    }
    assert(oft, `No oft for chainKey: ${chainKey}`);
    return OFTV1__factory.connect(oft.address, provider);
  }
}
