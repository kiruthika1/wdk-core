import type {CurrencyAmount, Currency, Transaction, FeeQuote} from '@wdk-account-abstraction-ton/ui-core';
import type {
  BridgeFeeBase,
  GetMessageFeeInput,
  GetOutputInput,
  BridgeOutput,
  GetDurationInput,
  Seconds,
  GetLimitInput,
  GetExtraGasInput,
  GetAllowanceInput,
  GetOptionsInput,
  BridgeOptions,
  GetUnclaimedInput,
  IsRegisteredInput,
  ClaimInput,
  RegisterInput,
  ApproveInput,
  TransferInput,
} from './types';

export interface BridgeApi<Signer = unknown, BridgeFee extends BridgeFeeBase = {}> {
  supportsClaim(currency: Currency): boolean;
  supportsRegister(currency: Currency): boolean;
  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean;
  // view functions
  getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote>;
  getOutput(input: GetOutputInput): Promise<BridgeOutput<BridgeFee>>;
  getDuration(input: GetDurationInput): Promise<Seconds>; // returns number of seconds
  getLimit(input: GetLimitInput): Promise<CurrencyAmount>;
  getExtraGas(input: GetExtraGasInput): Promise<number>;
  getAllowance(input: GetAllowanceInput): Promise<CurrencyAmount>;
  getOptions(input: GetOptionsInput): Promise<BridgeOptions>;
  // aptos specific
  getUnclaimed(input: GetUnclaimedInput): Promise<CurrencyAmount>;
  isRegistered(input: IsRegisteredInput): Promise<boolean>;
  // transactions
  transfer(input: Required<TransferInput>): Promise<Transaction<Signer>>;
  claim(input: ClaimInput): Promise<Transaction<Signer>>;
  register(register: RegisterInput): Promise<Transaction<Signer>>;
  approve(input: ApproveInput): Promise<Transaction<Signer>>;
}
