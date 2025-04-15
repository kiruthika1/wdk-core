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
import {
  AddressOne,
  AddressZero,
  type ProviderFactory,
  addressToBytes32,
  createTransaction,
  serializeAdapterParams,
} from '@wdk-account-abstraction-ton/ui-evm';
import {type Signer, utils} from 'ethers';

import {ProxyOFTV2__factory, OFTV2__factory} from '../../typechain';
import type {ICommonOFT} from '../../typechain/IOFTV2';
import type {OftBridgeConfig, OftBridgeFee} from '../../types';

import {OftBridgeV2Base, PacketType} from './OftBridgeV2Base';

export class OftBridgeV2 extends OftBridgeV2Base {
  constructor(
    protected providerFactory: ProviderFactory,
    public config: OftBridgeConfig,
  ) {
    super(providerFactory, config);
  }

  protected override validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    super.validateConfig(config);
    assert(config.fee === false, 'Invalid config.fee: is not false');
  }

  override async transfer(input: TransferInput): Promise<Transaction<Signer>> {
    this.validateInput(input);
    const srcChainKey = input.srcChainKey;
    const dstChainKey = input.dstChainKey;
    const contract = this.getContractV2(srcChainKey);
    const adapterParams = serializeAdapterParams(input.adapterParams);
    const amountLD = input.srcAmount;
    const value = this.isValidNative(input.srcToken)
      ? input.fee.nativeFee.add(input.srcAmount).quotient
      : input.fee.nativeFee.quotient;

    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const dstAddress = utils.hexlify(addressToBytes32(input.dstAddress));
    const callParams: ICommonOFT.LzCallParamsStruct = {
      adapterParams,
      refundAddress: input.srcAddress,
      zroPaymentAddress: AddressZero,
    };

    const populatedTransaction = contract.populateTransaction.sendFrom(
      input.srcAddress,
      dstEid,
      dstAddress,
      amountLD.quotient,
      callParams,
      {
        value,
        from: input.srcAddress,
        // manual gas limit that should cover most OFT transfers
        gasLimit: 500000,
        gasPrice: 100_000_000,
      },
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

    // Create a default/fallback fee quote with 0.0001 native token (e.g., 0.0001 ETH)
    const defaultFee: FeeQuote = {
      nativeFee: CurrencyAmount.fromRawAmount(native, BigInt(1e14)), // 0.0001 native token
      zroFee: CurrencyAmount.fromRawAmount(native, 0n),
    };

    try {
      const lzParams = serializeAdapterParams(adapterParams);
      const dstEid = this.chainKeyToEndpointId(dstChainKey);
      const dstAddress = utils.hexlify(addressToBytes32(AddressOne));
      const useZro = false;
      const amount = 0;

      const contract = this.getContractV2(srcChainKey);
      const response = await contract.estimateSendFee(dstEid, dstAddress, amount, useZro, lzParams);

      return {
        nativeFee: CurrencyAmount.fromRawAmount(native, response.nativeFee.toBigInt()),
        zroFee: CurrencyAmount.fromRawAmount(native, response.zroFee.toBigInt()),
      };
    } catch (error) {
      // If the contract call fails, return default fee quote
      console.warn(`Failed to get message fee for ${srcChainKey} -> ${dstChainKey}:`, error);
      return defaultFee;
    }
  }

  override async getExtraGas({srcToken, dstToken}: GetExtraGasInput): Promise<number> {
    const srcChainKey = srcToken.chainKey;
    const dstChainKey = dstToken.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const contract = this.getContractV2(srcChainKey);
    const defaultGas = this.getDefaultExtraGas(srcChainKey, dstChainKey);

    try {
      const extraGas = await contract.minDstGasLookup(dstEid, PacketType.PT_SEND);
      return extraGas.toNumber() || defaultGas;
    } catch (error) {
      // If contract call fails, fall back to default gas
      return defaultGas;
    }
  }

  override async getOutput({
    srcAmount,
    dstToken,
  }: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    const swapAmount = this.removeDust(srcAmount);
    const zero = swapAmount.multiply(0);

    const outputAmount = castCurrencyAmountUnsafe(swapAmount, dstToken);
    return {
      dstAmount: outputAmount,
      fee: {
        bridgeFee: zero,
      },
    };
  }

  protected getContractV2(chainKey: ChainKey) {
    const provider = this.providerFactory(chainKey);
    const {oftNative, oftProxy, oft} = this.getDeployment(chainKey);
    // NativeOFTV2 has same signature as ProxyOFTV2
    if (oftNative) {
      return ProxyOFTV2__factory.connect(oftNative.address, provider);
    }
    if (oftProxy) {
      return ProxyOFTV2__factory.connect(oftProxy.address, provider);
    }
    if (oft) {
      return OFTV2__factory.connect(oft.address, provider);
    }
    throw new Error(`No oft for chainKey: ${chainKey}`);
  }
}
