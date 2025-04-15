import {
  validateInput,
  type TransferInput,
  type GetMessageFeeInput,
  type GetExtraGasInput,
  type GetOutputInput,
  type BridgeOutput,
  type GetLimitInput,
  type GetDurationInput,
  type GetAllowanceInput,
  type ApproveInput,
  type IsRegisteredInput,
  type GetUnclaimedInput,
  type ClaimInput,
  type RegisterInput,
  type BridgeOptions,
  type GetOptionsInput,
  type BridgeOption,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  assert,
  type Currency,
  CurrencyAmount,
  type FeeQuote,
  isToken,
  type Transaction,
  MaxUint256,
  isEvmChainKey,
  getMessageDuration,
  isAptosChainKey,
  type ChainKey,
  hasAddress,
} from '@wdk-account-abstraction-ton/ui-core';
import {ERC20__api} from '@wdk-account-abstraction-ton/ui-evm';

import type {Signer} from 'ethers';
import type {ProviderFactory} from '@wdk-account-abstraction-ton/ui-evm';
import type {OftBridgeApi, OftBridgeConfig, OftBridgeFee} from '../../types';
import {getDeployment, tryGetDeployment} from '../../utils';
import {OFTV3_Adapter__factory} from '../../typechain';

export abstract class OftBridgeBase<Config extends OftBridgeConfig = OftBridgeConfig>
  implements OftBridgeApi<Signer>
{
  protected erc20: ERC20__api;
  constructor(
    protected readonly providerFactory: ProviderFactory,
    public readonly config: Config,
  ) {
    this.validateConfig(config);
    this.erc20 = new ERC20__api(providerFactory);
  }

  async getOptions(input: GetOptionsInput): Promise<BridgeOptions> {
    const taxiOption: BridgeOption = {
      mode: 'taxi',
    };
    return {options: [taxiOption]};
  }

  protected abstract validateConfig(config: Config): asserts config is Config;

  protected validateInput(input: TransferInput): asserts input is Required<TransferInput> {
    validateInput(input);
    const srcDeployment = this.getDeployment(input.srcChainKey);
    const dstDeployment = this.getDeployment(input.dstChainKey);
    assert(srcDeployment.token.equals(input.srcToken), 'Invalid srcToken');
    assert(dstDeployment.token.equals(input.dstToken), 'Invalid dstTOken');
  }

  // endpoint id is now implementation detail
  // API should use only this method to map to correct value
  protected chainKeyToEndpointId(chainKey: string) {
    return this.getDeployment(chainKey).eid;
  }

  supportsClaim(token: Currency): boolean {
    return this.supportsRegister(token);
  }

  supportsRegister(token: Currency): boolean {
    const {chainKey} = token;
    if (!isEvmChainKey(chainKey)) return false;
    return Boolean(this.tryGetDeployment(token.chainKey)?.token.equals(token));
  }

  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean {
    if (!isEvmChainKey(srcToken.chainKey)) return false;

    const srcDstChains = this.tryGetDeployment(srcToken.chainKey)?.destinationChains;
    if (srcDstChains) {
      if (!srcDstChains.includes(dstToken.chainKey)) {
        return false;
      }
    }
    return Boolean(
      this.tryGetDeployment(srcToken.chainKey)?.token.equals(srcToken) &&
        this.tryGetDeployment(dstToken.chainKey)?.token.equals(dstToken),
    );
  }

  async getDuration({srcToken, dstToken}: GetDurationInput): Promise<number> {
    const {oftProxy, token, oftNative, eid} = this.getDeployment(srcToken.chainKey);

    const address = oftProxy
      ? oftProxy.address
      : oftNative
        ? oftNative.address
        : isToken(token)
          ? token.address
          : null;

    assert(address, 'address');
    const ua = {address, eid};
    const dstEid = this.chainKeyToEndpointId(dstToken.chainKey);
    return getMessageDuration(ua, dstEid);
  }

  async getAllowance({token, address, dstChainKey}: GetAllowanceInput): Promise<CurrencyAmount> {
    assert(isToken(token));
    const {oftProxy, oftNative} = this.getDeployment(token.chainKey);

    let oft: typeof oftProxy | typeof oftNative;
    let approvalRequired: boolean | undefined = true;
    if (dstChainKey && !isEvmChainKey(dstChainKey) && oftNative) {
      oft = oftNative;
    } else {
      oft = oftProxy;
      approvalRequired = oftProxy?.approvalRequired !== false;
    }

    // OFTs, NATIVE and mint & burn proxies don't need to be approved
    const skipApproval = !oft || !hasAddress(token) || approvalRequired === false;

    if (skipApproval) {
      return CurrencyAmount.fromRawAmount(token, MaxUint256);
    }

    // @ts-ignore
    return this.erc20.forToken(token).allowance(address, oft.address);
  }

  async approve({amount, dstChainKey}: ApproveInput) {
    const {oftProxy, oftNative} = this.getDeployment(amount.token.chainKey);
    let oft: typeof oftProxy | typeof oftNative;
    if (dstChainKey && !isEvmChainKey(dstChainKey) && oftNative) {
      oft = oftNative;
    } else {
      oft = oftProxy;
    }
    assert(oft, 'No oftProxy or oftNative');
    return this.erc20.forToken(amount.token).approve(amount, oft.address);
  }

  async isRegistered(input: IsRegisteredInput): Promise<boolean> {
    return true;
  }

  async getUnclaimed({token}: GetUnclaimedInput): Promise<CurrencyAmount<Currency>> {
    return CurrencyAmount.fromRawAmount(token, 0);
  }

  claim(input: ClaimInput): Promise<Transaction<Signer>> {
    throw new Error('Method not supported.');
  }

  register(input: RegisterInput): Promise<Transaction<Signer>> {
    throw new Error('Method not supported.');
  }

  abstract transfer(input: TransferInput): Promise<Transaction<Signer>>;

  abstract getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote>;

  abstract getExtraGas(input: GetExtraGasInput): Promise<number>;

  abstract getOutput(input: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>>;

  async getLimit({srcToken}: GetLimitInput): Promise<CurrencyAmount<Currency>> {
    return CurrencyAmount.fromRawAmount(srcToken, MaxUint256);
  }

  protected tryGetDeployment(chainKey: ChainKey) {
    return tryGetDeployment(chainKey, this.config);
  }

  protected getDeployment(chainKey: string) {
    return getDeployment(chainKey, this.config);
  }

  protected getDefaultExtraGas(srcChainKey: string, dstChainKey: string): number {
    // in case extraGas returns 0
    // providing some sane defaults
    return dstChainKey === 'arbitrum'
      ? 3_000_000
      : isAptosChainKey(dstChainKey)
        ? 10_000
        : // other evm
          250_000;
  }
}
