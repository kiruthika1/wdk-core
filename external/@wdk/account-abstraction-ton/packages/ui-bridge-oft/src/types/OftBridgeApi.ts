import type {BridgeApi} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import type {CurrencyAmount} from '@wdk-account-abstraction-ton/ui-core';

export type OftBridgeApi<Signer> = BridgeApi<Signer, OftBridgeFee>;
export type OftBridgeFee = {bridgeFee: CurrencyAmount};
