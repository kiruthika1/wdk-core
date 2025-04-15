import type {
  BridgeOutput,
  GetExtraGasInput,
  GetMessageFeeInput,
  GetOutputInput,
  TransferInput,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  type Transaction,
  type FeeQuote,
  CurrencyAmount,
  castCurrencyAmountUnsafe,
  getNativeCurrency,
  type ChainKey,
  assert,
} from '@wdk-account-abstraction-ton/ui-core';
import {type Signer, constants, utils} from 'ethers';
import {OFTV2Fee__factory, ProxyOFTV2Fee__factory} from '../../typechain';
import {
  AddressOne,
  addressToBytes32,
  type ProviderFactory,
  createTransaction,
  serializeAdapterParams,
} from '@wdk-account-abstraction-ton/ui-evm';
import type {ICommonOFT} from '../../typechain/OFTV2Fee';
import type {OftBridgeConfig, OftBridgeFee} from '../../types';
import {OftBridgeV2Base, PacketType} from './OftBridgeV2Base';

export class OftBridgeV2Fee extends OftBridgeV2Base {
  constructor(
    protected providerFactory: ProviderFactory,
    config: OftBridgeConfig,
  ) {
    super(providerFactory, config);
  }

  protected validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    super.validateConfig(config);
    assert(config.fee === true, 'Invalid config.fee: is not true');
  }

  override async transfer(input: TransferInput): Promise<Transaction<Signer>> {
    this.validateInput(input);
    const srcChainKey = input.srcChainKey;
    const contract = this.getContractV2Fee(srcChainKey);

    const adapterParams = serializeAdapterParams(input.adapterParams);
    const amountLD = input.srcAmount;
    const minAmountLD = castCurrencyAmountUnsafe(
      // at this point cast should be safe
      input.dstAmountMin,
      input.srcToken,
    );

    const value = this.isValidNative(input.srcToken)
      ? input.fee.nativeFee.add(input.srcAmount).quotient
      : input.fee.nativeFee.quotient;

    const dstEid = this.chainKeyToEndpointId(input.dstChainKey);
    const dstAddress = utils.hexlify(addressToBytes32(input.dstAddress));
    const callParams: ICommonOFT.LzCallParamsStruct = {
      adapterParams,
      refundAddress: input.srcAddress,
      zroPaymentAddress: constants.AddressZero,
    };

    const populatedTransaction = await contract.populateTransaction.sendFrom(
      input.srcAddress,
      dstEid,
      dstAddress,
      amountLD.quotient,
      minAmountLD.quotient,
      callParams,
      {value, from: input.srcAddress},
    );

    const tx = createTransaction(populatedTransaction, {
      provider: this.providerFactory(srcChainKey),
      chainKey: srcChainKey,
    });
    return tx;
  }

  override async getMessageFee({
    srcToken,
    dstToken,
    adapterParams,
  }: GetMessageFeeInput): Promise<FeeQuote> {
    const srcChainKey = srcToken.chainKey;
    const dstChainKey = dstToken.chainKey;
    const native = getNativeCurrency(srcChainKey);

    const lzParams = serializeAdapterParams(adapterParams);
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const dstAddress = AddressOne;
    const useZro = false;

    const amount = 0;

    const contract = this.getContractV2Fee(srcChainKey);

    const response = await contract.estimateSendFee(
      dstEid,
      addressToBytes32(dstAddress),
      amount,
      useZro,
      lzParams,
    );

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
    const contract = this.getContractV2Fee(srcChainKey);
    const extraGas = await contract.minDstGasLookup(dstEid, PacketType.PT_SEND);
    // if 0 then getDefaultExtraGas
    return extraGas.toNumber() || this.getDefaultExtraGas(srcChainKey, dstChainKey);
  }

  override async getOutput({
    srcAmount,
    dstToken,
  }: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    const dstChainKey = dstToken.chainKey;
    const swapAmount = this.removeDust(srcAmount);
    const bridgeFee = await this.getBridgeFee(swapAmount, dstChainKey);

    const outputAmountLD = swapAmount.subtract(bridgeFee);
    const outputAmountRD = castCurrencyAmountUnsafe(outputAmountLD, dstToken);
    return {
      fee: {bridgeFee: bridgeFee},
      dstAmount: outputAmountRD,
    };
  }

  protected async getBridgeFee(
    inputAmount: CurrencyAmount,
    dstChainKey: ChainKey,
  ): Promise<CurrencyAmount> {
    const srcChainKey = inputAmount.token.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const swapAmount = this.removeDust(inputAmount);
    const contract = this.getContractV2Fee(srcChainKey);
    const fee = await contract.quoteOFTFee(dstEid, swapAmount.quotient);
    return CurrencyAmount.fromRawAmount(swapAmount.token, fee.toBigInt());
  }

  protected getContractV2Fee(chainKey: ChainKey) {
    const provider = this.providerFactory(chainKey);
    const {oftNative, oftProxy, oft} = this.getDeployment(chainKey);
    // NativeOFTV2Fee aka NativeOFTWithFee has same signature as ProxyOFTV2Fee
    if (oftNative) {
      return ProxyOFTV2Fee__factory.connect(oftNative.address, provider);
    }
    if (oftProxy) {
      return ProxyOFTV2Fee__factory.connect(oftProxy.address, provider);
    }
    if (oft) {
      return OFTV2Fee__factory.connect(oft.address, provider);
    }
    throw new Error(`No oft for chainKey: ${chainKey}`);
  }
}
