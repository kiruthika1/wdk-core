import {coreModule} from '../core';

// users should use CoreModule
// exposing single functions for backwards compatibility

// wrapping to enable monkey patching of coreModule
export const tryGetNetwork: typeof coreModule.tryGetNetwork = (chainKey) => {
  return coreModule.tryGetNetwork(chainKey);
};

export const getNetwork: typeof coreModule.getNetwork = (chainKey) => {
  return coreModule.getNetwork(chainKey);
};

export const getBlockExplorers: typeof coreModule.getBlockExplorers = (chainKey) => {
  return coreModule.getBlockExplorers(chainKey);
};

export const getRpcs: typeof coreModule.getRpcs = (chainKey) => coreModule.getRpcs(chainKey);

export const tryGetNativeCurrency: typeof coreModule.tryGetNativeCurrency = (chainKey) => {
  return coreModule.tryGetNativeCurrency(chainKey);
};

export const getNativeCurrency: typeof coreModule.getNativeCurrency = (chainKey) => {
  return coreModule.getNativeCurrency(chainKey);
};

export const tryGetNetworkByNativeChainId: typeof coreModule.tryGetNetworkByNativeChainId = (
  chainType,
  nativeChainId,
) => {
  return coreModule.tryGetNetworkByNativeChainId(chainType, nativeChainId);
};

export const getNetworkByNativeChainId: typeof coreModule.getNetworkByNativeChainId = (
  chainType,
  nativeChainId,
) => {
  return coreModule.getNetworkByNativeChainId(chainType, nativeChainId);
};

export const isNativeCurrency: typeof coreModule.isNativeCurrency = (currency) => {
  return coreModule.isNativeCurrency(currency);
};

export const endpointIdToStage: typeof coreModule.endpointIdToStage = (eid) =>
  coreModule.endpointIdToStage(eid);

export const endpointIdToChainKey: typeof coreModule.endpointIdToChainKey = (eid) => {
  return coreModule.endpointIdToChainKey(eid);
};

export const chainKeyToEndpointId: typeof coreModule.chainKeyToEndpointId = (
  chainKey,
  version,
  stage,
) => {
  return coreModule.chainKeyToEndpointId(chainKey, version, stage);
};

export const isChainType: typeof coreModule.isChainType = (chainKey, chainType) => {
  return coreModule.isChainType(chainKey, chainType);
};

export const getScanLink: typeof coreModule.getScanLink = (input) => {
  return coreModule.getScanLink(input);
};

export const getExplorerLink = (
  input: {chainKey: string; address: string} | {chainKey: string; txHash: string},
) => {
  if ('address' in input) {
    return `https://layerzeroscan.com/api/explorer/${input.chainKey}/address/${input.address}`;
  }
  return `https://layerzeroscan.com/api/explorer/${input.chainKey}/tx/${input.txHash}`;
};
