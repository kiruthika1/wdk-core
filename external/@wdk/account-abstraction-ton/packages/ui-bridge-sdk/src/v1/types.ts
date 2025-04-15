import type {
  CurrencyAmount,
  Currency,
  AdapterParams,
  FeeQuote,
  ChainKey,
} from '@wdk-account-abstraction-ton/ui-core';

export type PartialTransferInput<RequiredKeys extends keyof TransferInput> =
  Partial<TransferInput> & Required<Pick<TransferInput, RequiredKeys>>;

export type Seconds = number;
export type GetMessageFeeInput = PartialTransferInput<'srcToken' | 'dstToken' | 'adapterParams'>;
export type GetOutputInput = PartialTransferInput<'srcAmount' | 'dstToken'>;
export type GetLimitInput = PartialTransferInput<'srcToken' | 'dstToken'>;
export type GetDurationInput = PartialTransferInput<'srcToken' | 'dstToken' | 'mode'>;
export type GetDurationResult = {estimated: Seconds};
export type GetExtraGasInput = PartialTransferInput<'srcToken' | 'dstToken'>;
export type GetOptionsInput = {srcToken: Currency; dstToken: Currency};

export type GetAllowanceInput = {token: Currency; address: string; dstChainKey?: ChainKey};
export type GetUnclaimedInput = {token: Currency; address: string};
export type IsRegisteredInput = {token: Currency; address: string};

export type ClaimInput = {token: Currency; address: string};
export type RegisterInput = {token: Currency; address: string};
export type ApproveInput = {amount: CurrencyAmount; address: string; dstChainKey?: ChainKey};

export type BridgeOutput<BridgeFee extends BridgeFeeBase> = {
  /**
   * expressed in dstToken
   */
  dstAmount: CurrencyAmount;
  /**
   * custom to each implementation
   */
  fee: BridgeFee;
};

export type BridgeFeeBase = {[key: string]: CurrencyAmount};

export type BridgeMode = string;
export interface BridgeOptions {
  options: BridgeOption[];
}
export interface BridgeOption {
  mode: BridgeMode;
  // if option native drop is limited
  nativeDrop?: {
    maxAmount: CurrencyAmount;
    isFixed: boolean;
  };
}

// @deprecated: use BridgeApiV2
export type TransferInput = {
  mode: BridgeMode;
  srcChainKey: ChainKey;
  dstChainKey: ChainKey;
  srcToken: Currency;
  dstToken: Currency;
  srcAmount: CurrencyAmount; // expressed in srcToken
  dstAmountMin: CurrencyAmount; //expressed in dstToken
  srcAddress: string;
  dstAddress: string;
  dstNativeAmount: CurrencyAmount;
  fee: FeeQuote;
  adapterParams: AdapterParams;
};
