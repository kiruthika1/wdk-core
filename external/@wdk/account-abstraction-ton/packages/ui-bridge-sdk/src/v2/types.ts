import type {ChainKey, Currency, CurrencyAmount, MessageFee} from '@wdk-account-abstraction-ton/ui-core';

export type BridgeMode = string;

export type GetOptionsInput = {srcToken: Currency; dstToken: Currency};

export interface BridgeOption {
  mode: BridgeMode;
  // if option native drop is limited
  nativeDrop?: {
    maxAmount: CurrencyAmount;
    isFixed: boolean;
  };
}

export interface TransferInput {
  mode: BridgeMode;
  srcChainKey: ChainKey;
  dstChainKey: ChainKey;
  srcToken: Currency;
  dstToken: Currency;
  srcAmount: CurrencyAmount;
  dstAmountMin: CurrencyAmount;
  srcAddress: string;
  dstAddress: string;
  dstNativeAmount: CurrencyAmount;
}

export interface BridgeOptions {
  options: BridgeOption[];
}

export type PartialTransferInput<RequiredKeys extends keyof TransferInput> =
  Partial<TransferInput> & Required<Pick<TransferInput, RequiredKeys>>;

export type Seconds = number;
export type GetDurationInput = PartialTransferInput<'srcToken' | 'dstToken' | 'mode'>;
export type GetDurationResult = {estimated: Seconds};

export interface GetRouteInput {
  mode: BridgeMode;
  srcToken: Currency;
  dstToken: Currency;
  srcAddress: string;
  dstAddress: string;
  srcAmount: CurrencyAmount;
  dstAmountMin: CurrencyAmount;
  dstNativeAmount: CurrencyAmount;
}

export interface ResolvedRoute {
  mode: BridgeMode;
  srcAddress: string;
  dstAddress: string;
  srcToken: Currency;
  dstToken: Currency;
  // result of swap
  srcAmount: CurrencyAmount; // actually swapped amount
  dstAmount: CurrencyAmount; // expected received amount
  dstAmountMin: CurrencyAmount; // min received amount
  dstNativeAmount: CurrencyAmount; // native drop amount
  duration: {
    estimated: number;
  };
  srcAmountMax: CurrencyAmount; // max amount that can be swapped
  allowance: CurrencyAmount;
  error?: undefined;

  //
  messageFee: MessageFee;
  gasCost: CurrencyAmount;
  option: BridgeOption;
}

export interface RejectedRoute extends Partial<Omit<ResolvedRoute, 'error'>> {
  error: Error;
}

export type GetRouteResult = ResolvedRoute | RejectedRoute;

export interface GetUnclaimedInput {
  token: Currency;
  owner: string;
}

export type GetUnclaimedResult = CurrencyAmount;

export interface ClaimInput {
  token: Currency;
  owner: string;
}
