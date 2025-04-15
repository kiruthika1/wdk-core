import type {ChainKey} from './ChainKey';

export type Rpc = {url: string; timeout?: number; weight?: number};
export type RpcList = Rpc[];
export type RpcMap = {[chainKey in ChainKey]?: RpcList};
