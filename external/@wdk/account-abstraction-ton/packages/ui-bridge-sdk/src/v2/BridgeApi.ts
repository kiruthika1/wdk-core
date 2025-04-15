import type {Currency, Transaction} from '@wdk-account-abstraction-ton/ui-core';
import type {
  BridgeOptions,
  GetDurationInput,
  GetDurationResult,
  GetOptionsInput,
  GetRouteInput,
  GetRouteResult,
  TransferInput,
} from './types';

export interface BridgeApi<Signer = unknown> {
  getOptions(input: GetOptionsInput): Promise<BridgeOptions>;
  getRoute(input: GetRouteInput): Promise<GetRouteResult>;
  getDuration?(input: GetDurationInput): Promise<GetDurationResult>;
  approve?(input: TransferInput): Promise<Transaction<Signer>>;
  transfer(input: TransferInput): Promise<Transaction<Signer>>;
  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean;
}
