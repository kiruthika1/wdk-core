import {assert, type Currency, CurrencyAmount, removeDust} from '@wdk-account-abstraction-ton/ui-core';
import {constants} from 'ethers';
import {OftBridgeBase} from './OftBridgeBase';
import type {ProviderFactory} from '@wdk-account-abstraction-ton/ui-evm';
import type {OftBridgeConfig} from '../../types';
import type {GetAllowanceInput} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';

export enum PacketType {
  PT_SEND = 0,
  PT_SEND_AND_CALL = 1,
}

export abstract class OftBridgeV2Base extends OftBridgeBase {
  constructor(
    protected providerFactory: ProviderFactory,
    config: OftBridgeConfig,
  ) {
    super(providerFactory, config);
  }

  protected validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    assert(config.sharedDecimals, 'Invalid config.sharedDecimals: not provided');
    assert(config.version === 2, 'Invalid config.version: is not 2');
  }

  async getAllowance({token, address}: GetAllowanceInput): Promise<CurrencyAmount<Currency>> {
    if (this.isValidNative(token)) {
      return CurrencyAmount.fromRawAmount(token, constants.MaxUint256.toBigInt());
    }
    return super.getAllowance({token, address});
  }

  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean {
    // native -> token
    if (this.isValidNative(srcToken) && this.isValidToken(dstToken)) {
      return true;
    }
    // token -> native
    if (this.isValidToken(srcToken) && this.isValidNative(dstToken)) {
      return true;
    }
    // token -> token
    return super.supportsTransfer(srcToken, dstToken);
  }

  supportsRegister(token: Currency): boolean {
    return this.isValidNative(token) || super.supportsRegister(token);
  }

  supportsClaim(token: Currency): boolean {
    return this.supportsRegister(token);
  }

  protected isValidNative(native: Currency): boolean {
    const {oftNative, token} = this.tryGetDeployment(native.chainKey) ?? {};
    if (!token) return false; // no deployment for chain
    if (!oftNative) return false; // deployment has no native
    return native.equals(token);
  }

  protected isValidToken(token: Currency): boolean {
    const deployment = this.tryGetDeployment(token.chainKey);
    if (!deployment?.token) return false; // no deployment for chain
    return deployment.token.equals(token);
  }

  protected removeDust(amount: CurrencyAmount) {
    return removeDust(amount, this.config.sharedDecimals);
  }
}
