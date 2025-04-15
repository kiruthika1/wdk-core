import {interpolateString} from './interpolateString';
import type {RpcMap} from '../types/Rpc';
import {rpcMap as defaultRpcMap} from '../config/rpcs';

export function createRpcMap(
  rawRpcMap: RpcMap = defaultRpcMap,
  env: Record<string, string | number> = {},
): RpcMap {
  const rpcMap: RpcMap = {};
  for (const [chainKey, rawRpcList] of Object.entries(rawRpcMap)) {
    if (!rawRpcList) continue;
    const rpcList = [];
    for (const rpc of rawRpcList) {
      if (!rpc.url.startsWith('https://')) continue;
      try {
        const url = interpolateString(rpc.url, env);
        rpcList.push({
          ...rpc,
          url,
        });
      } catch {
        // no variable interpolation error
      }
    }
    rpcMap[chainKey] = rpcList;
  }
  return rpcMap;
}
