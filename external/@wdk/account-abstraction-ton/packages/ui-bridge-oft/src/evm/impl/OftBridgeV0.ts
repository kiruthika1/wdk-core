import type {
  BridgeOutput,
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
import {BigNumber, type Signer, constants, utils} from 'ethers';
import {OftBridgeBase} from './OftBridgeBase';
import {
  type ProviderFactory,
  createTransaction,
  serializeAdapterParams,
} from '@wdk-account-abstraction-ton/ui-evm';
import {OFTV0__factory} from '../../typechain/factories/OFTV0__factory';
import {Endpoint__factory} from '../../typechain';
import type {OftBridgeConfig, OftBridgeFee} from '../../types';

export class OftBridgeV0 extends OftBridgeBase {
  constructor(
    protected providerFactory: ProviderFactory,
    public config: OftBridgeConfig,
  ) {
    super(providerFactory, config);
  }

  protected validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    assert(config.version === 0, 'Invalid config.version: is not 0');
    assert(config.fee === false, 'Invalid config.fee: is not false');
  }

  async transfer(input: TransferInput): Promise<Transaction<Signer>> {
    this.validateInput(input);
    const srcChainKey = input.srcChainKey;
    const provider = this.providerFactory(srcChainKey);
    const contract = this.getContractV0(srcChainKey);
    const adapterParams = serializeAdapterParams(input.adapterParams);
    const dstEid = this.chainKeyToEndpointId(input.dstChainKey);
    const value = input.fee.nativeFee.quotient;

    const populatedTransaction = await contract.populateTransaction.sendTokens(
      dstEid,
      input.dstAddress,
      input.srcAmount.quotient,
      constants.AddressZero,
      adapterParams,
      {value},
    );

    return createTransaction(populatedTransaction, {provider, chainKey: srcChainKey});
  }

  override async getMessageFee({
    srcToken,
    dstToken,
    adapterParams,
  }: GetMessageFeeInput): Promise<FeeQuote> {
    // can't call estimateSendTokensFee -> contract payload is hardcoded to 0x
    // must call endpoint directly
    const srcChainKey = srcToken.chainKey;
    const srcNative = getNativeCurrency(srcChainKey);
    const contract = this.getContractV0(srcChainKey);
    const dstEid = this.chainKeyToEndpointId(dstToken.chainKey);

    // any address
    const dstAddress = contract.address;
    const dstNativeAmount = adapterParams.dstNativeAmount
      ? adapterParams.dstNativeAmount.quotient
      : BigNumber.from(0);

    const payload = utils.defaultAbiCoder.encode(
      ['bytes', 'uint256'],
      [dstAddress, dstNativeAmount],
    );

    const endpoint = Endpoint__factory.connect(
      await contract.endpoint(),
      this.providerFactory(srcToken.chainKey),
    );

    const fee = await endpoint.estimateFees(
      dstEid,
      dstAddress,
      payload,
      false,
      serializeAdapterParams(adapterParams),
    );
    const nativeFee = CurrencyAmount.fromRawAmount(srcNative, fee.nativeFee.toBigInt());

    return {
      nativeFee,
      zroFee: nativeFee.multiply(0),
    };
  }

  override async getExtraGas(): Promise<number> {
    // magic number
    return 85000;
  }

  override async getOutput({
    srcAmount,
    dstToken,
  }: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    const zero = srcAmount.multiply(0);
    // its safe all STG have same number of decimals
    const outputAmount = castCurrencyAmountUnsafe(srcAmount, dstToken);
    return {
      dstAmount: outputAmount,
      fee: {
        bridgeFee: zero,
      },
    };
  }

  protected getContractV0(chainKey: ChainKey) {
    const {oft} = this.getDeployment(chainKey);
    assert(oft, `No oft for chainKey: ${chainKey}`);
    return OFTV0__factory.connect(oft.address, this.providerFactory(chainKey));
  }
}
