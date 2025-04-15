import {
  assert,
  chainKeyToEndpointId,
  endpointIdToChainKey,
  endpointIdToStage,
  getNativeCurrency,
  type Token,
} from '@wdk-account-abstraction-ton/ui-core';
import type {SerializedOftBridgeConfig} from '../types';

type OldOftBridgeConfig = {
  fee?: boolean;
  sharedDecimals: number;
  version: number;
  tokens: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
    name: string;
  }[];
  proxy?: {
    chainId: number;
    address: string;
  }[];
  native?: {
    chainId: number;
    address: string;
  }[];
};

export function convertFromV1(
  oldOftBridgeConfig: OldOftBridgeConfig,
  endpointVersion: 1 | 2,
): SerializedOftBridgeConfig {
  const oftBridgeConfig: SerializedOftBridgeConfig = {
    sharedDecimals: oldOftBridgeConfig.sharedDecimals,
    version: oldOftBridgeConfig.version,
    fee: oldOftBridgeConfig.fee ?? false,
    deployments: {},
  };
  const chainIds = new Set<number>();
  oldOftBridgeConfig.tokens.forEach((token) => {
    chainIds.add(token.chainId);
  });
  oldOftBridgeConfig.proxy?.forEach((proxy) => {
    chainIds.add(proxy.chainId);
  });
  oldOftBridgeConfig.native?.forEach((native) => {
    chainIds.add(native.chainId);
  });
  for (const chainId of chainIds) {
    const chainKey = endpointIdToChainKey(chainId);
    const stage = endpointIdToStage(chainId);
    const eid = chainKeyToEndpointId(chainKey, endpointVersion, stage);
    const native = oldOftBridgeConfig.native?.find((native) => native.chainId === chainId);
    const token =
      oldOftBridgeConfig.tokens.find((token) => token.chainId === chainId) ??
      (native ? getNativeCurrency(chainKey) : undefined);

    const proxy = oldOftBridgeConfig.proxy?.find((proxy) => proxy.chainId === chainId);
    assert(token, `Token for ${chainKey} not found`);
    const deployment: SerializedOftBridgeConfig['deployments'][string] = {
      eid: eid,
      token: {
        chainKey,
        address: (token as Token).address,
        decimals: token?.decimals,
        name: token?.name,
        symbol: token?.symbol,
      },
      oftNative: native ? {address: native.address} : undefined,
      oftProxy: proxy ? {address: proxy.address} : undefined,
    };
    oftBridgeConfig.deployments[chainKey] = deployment;
  }
  return oftBridgeConfig;
}
