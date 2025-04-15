import type {
  BridgeOutput,
  GetExtraGasInput,
  GetLimitInput,
  GetMessageFeeInput,
  GetOutputInput,
  TransferInput,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  AdapterParams,
  assert,
  castCurrencyAmountUnsafe,
  type ChainKey,
  type Currency,
  CurrencyAmount,
  type FeeQuote,
  getNativeCurrency,
  isEvmChainKey,
  MaxUint256,
  MessageFee,
  parseCurrencyAmount,
  type Transaction,
} from '@wdk-account-abstraction-ton/ui-core';
import {
  AddressOne,
  AddressZero,
  createTransaction,
  type ProviderFactory,
} from '@wdk-account-abstraction-ton/ui-evm';
import {type Signer, utils} from 'ethers';

import {OFTV3__factory, OFTV3_Adapter, OFTV3_Adapter__factory} from '../../typechain';
import type {SendParamStruct} from '../../typechain/OFTV3';
import type {OftBridgeConfig, OftBridgeFee} from '../../types';
import {createOptions, addressToBytes32ForChain} from '../../utils';

import {OftBridgeBase} from './OftBridgeBase';
import {ChainKey as ChainKeyEnum} from '@layerzerolabs/lz-definitions';

// USDT Specific
export const POOL_TOKEN_CHAINS: string[] = [
  ChainKeyEnum.TRON,
  ChainKeyEnum.TRONDEV,
  ChainKeyEnum.TRON_TESTNET,
  ChainKeyEnum.CELO,
  // ChainKey comes from lz-definitions. The version we use doesn't have ton. @layerzerolabs/lz-solana-sdk-v2 is preventing
  // an easy upgrade of lz-definitions.
  'ton',
];
export class OftBridgeV3 extends OftBridgeBase {
  constructor(
    protected providerFactory: ProviderFactory,
    public config: OftBridgeConfig,
  ) {
    super(providerFactory, config);
  }

  protected validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    assert(config.version === 3, 'Invalid config.version: is not 3');
  }

  override async transfer(input: TransferInput): Promise<Transaction<Signer>> {
    this.validateInput(input);

    const {srcChainKey, srcAddress, dstChainKey} = input;
    const contract = this.getContract(srcChainKey, dstChainKey);

    const isNativeTransfer = input.fee.nativeFee.token.equals(input.srcAmount.token);
    const value = isNativeTransfer
      ? input.fee.nativeFee.add(input.srcAmount).toBigInt()
      : input.fee.nativeFee.toBigInt();

    const sendParams = await this.buildSendParams(input);
    const fee = {
      nativeFee: input.fee.nativeFee.toBigInt(),
      lzTokenFee: input.fee.zroFee.toBigInt(),
    };

    try {
      const populatedTransaction = contract.populateTransaction.send(sendParams, fee, srcAddress, {
        value,
        from: srcAddress,
        // manual gas limit that should cover most OFT transfers
        // gasLimit: 500000,
        // gasPrice: 100_000_000_000,
      });

      // const gasEstimate = await this.providerFactory(srcChainKey).estimateGas(await populatedTransaction);

      return createTransaction(populatedTransaction, {
        provider: this.providerFactory(srcChainKey),
        chainKey: srcChainKey,
      });
    } catch (error) {
      throw error;
    }
  }

  override async getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote> {
    // todo: require amount in GetMessageFeeInput
    // mocking: dstAddress, amount, minAmount - they shouldn't affect the fee
    const dstAddress = input.dstAddress ?? AddressOne;
    const srcAmount = input.srcAmount ?? parseCurrencyAmount(input.srcToken, '1');
    const dstAmountMin = input.dstAmountMin ?? CurrencyAmount.fromBigInt(input.dstToken, BigInt(0));
    const srcChainKey = input.srcToken.chainKey;
    const dstChainKey = input.dstToken.chainKey;
    const useZro = false;

    const contract = this.getContract(srcChainKey, dstChainKey);
    const sendParams = await this.buildSendParams({
      adapterParams: input.adapterParams,
      dstToken: input.dstToken,
      srcAmount,
      dstAmountMin,
      dstAddress,
    });

    try {
      const response = await contract.quoteSend(sendParams, useZro);

      const fee: FeeQuote = MessageFee.from(srcChainKey, {
        nativeFee: response.nativeFee.toBigInt(),
        zroFee: response.lzTokenFee.toBigInt(),
      });

      return fee;
    } catch (error) {
      // Create a default/fallback fee quote with 0.0001 native token (e.g., 0.0001 ETH)
      // This is so we can specify a manual gas even if this fails.
      const native = getNativeCurrency(srcChainKey);

      return {
        nativeFee: CurrencyAmount.fromRawAmount(native, BigInt(1e14)), // 0.0001 native token
        zroFee: CurrencyAmount.fromRawAmount(native, 0n),
      };
    }
  }

  // We do not need to get the enforced options from the contract, they are already applied.
  override async getExtraGas(input: GetExtraGasInput): Promise<number> {
    return 0;
  }

  override async getOutput(input: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    const {dstToken} = input;
    const srcToken = input.srcAmount.token;
    // mocking: adapterParams, dstAddress, minAmount - they shouldn't affect the output
    const dstAmountMin = input.dstAmountMin ?? CurrencyAmount.fromBigInt(dstToken, BigInt(0));
    const adapterParams = input.adapterParams ?? AdapterParams.forV1(0);
    const dstAddress = input.dstAddress ?? AddressZero;
    const {srcAmount} = input;
    const srcChainKey = srcAmount.token.chainKey;
    const dstChainKey = input.dstToken.chainKey;

    const contract = this.getContract(srcChainKey, dstChainKey);

    const sendParams = await this.buildSendParams({
      srcAmount,
      dstToken,
      adapterParams,
      dstAmountMin,
      dstAddress,
    });
    const {oftReceipt} = await contract.quoteOFT(sendParams);

    const outputAmountLD = CurrencyAmount.fromBigInt(
      srcToken,
      oftReceipt.amountReceivedLD.toBigInt(),
    );
    const outputAmountRD = castCurrencyAmountUnsafe(outputAmountLD, dstToken);
    const sentAmountLD = CurrencyAmount.fromBigInt(srcToken, oftReceipt.amountSentLD.toBigInt());

    const bridgeFee = outputAmountLD.subtract(sentAmountLD);

    return {
      fee: {bridgeFee},
      dstAmount: outputAmountRD,
    };
  }

  private async buildSendParams(input: SendParamsInput): Promise<SendParamStruct> {
    const {dstToken, srcAmount, adapterParams, dstAddress} = input;
    const dstChainKey = dstToken.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);

    const minAmount = castCurrencyAmountUnsafe(input.dstAmountMin, srcAmount.token);
    const options = await this.createOptions({adapterParams, dstChainKey});
    return {
      dstEid: BigInt(dstEid),
      to: addressToBytes32ForChain(dstAddress, dstChainKey),
      amountLD: srcAmount.toBigInt(),
      minAmountLD: minAmount.toBigInt(),
      extraOptions: options.toHex(),
      composeMsg: '0x',
      oftCmd: '0x',
    };
  }

  override async getLimit({srcToken, dstToken}: GetLimitInput): Promise<CurrencyAmount<Currency>> {
    const {chainKey: dstChainKey} = dstToken;
    const {chainKey: srcChainKey} = srcToken;

    if (POOL_TOKEN_CHAINS.includes(dstChainKey) && POOL_TOKEN_CHAINS.includes(srcChainKey)) {
      const contract = this.getContract(srcChainKey, dstChainKey) as OFTV3_Adapter;
      const availCredits = await contract.credits(this.getDeployment(dstToken.chainKey).eid);
      return CurrencyAmount.fromBigInt(srcToken, availCredits.toBigInt());
    }
    return CurrencyAmount.fromRawAmount(srcToken, MaxUint256);
  }

  // The extra gas value in AdapterParams can be ignored because the extra gas is already
  // enforced and automatically applied to the tx. We only need to serialize the dst native amount
  // and address, which only exist in our AdapterParams V2.
  public async createOptions({
    adapterParams,
    dstChainKey,
  }: {
    adapterParams: AdapterParams;
    dstChainKey: ChainKey;
  }) {
    return createOptions({adapterParams, dstChainKey}, this.config);
  }

  protected getContract(srcChainKey: ChainKey, dstChainKey: ChainKey) {
    const {oftProxy, oft, oftNative} = this.getDeployment(srcChainKey);
    const provider = this.providerFactory(srcChainKey);

    if (!isEvmChainKey(dstChainKey) && oftNative) {
      return OFTV3_Adapter__factory.connect(oftNative.address, provider);
    }
    if (oftProxy) {
      return OFTV3_Adapter__factory.connect(oftProxy.address, provider);
    }

    assert(oft, `No oft for chainKey: ${srcChainKey}`);
    return OFTV3__factory.connect(oft.address, provider);
  }
}

type SendParamsInput = Pick<
  TransferInput,
  'adapterParams' | 'dstToken' | 'srcAmount' | 'dstAmountMin' | 'dstAddress'
>;
