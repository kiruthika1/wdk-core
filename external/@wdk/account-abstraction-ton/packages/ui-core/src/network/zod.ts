import z from 'zod';
import type {Network} from './types';
import {Coin, Token} from '../currency';
import {ChainType} from '../types/ChainType';
import {ChainKey} from '../types/ChainKey';

export const serializedNetworkSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  chainKey: z.string(),
  chainType: z.nativeEnum(ChainType),
  nativeChainId: z.union([z.number(), z.string()]),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    address: z.string().optional(),
  }),
});

export const networkSchema = serializedNetworkSchema.transform(({nativeCurrency, ...input}) => {
  const network: Network = {
    name: input.name,
    shortName: input.shortName,
    chainKey: input.chainKey as ChainKey,
    chainType: input.chainType as ChainType,
    nativeChainId: input.nativeChainId,
    nativeCurrency: nativeCurrency.address
      ? // @ts-ignore
        Token.from({
          ...nativeCurrency,
          address: nativeCurrency.address,
          chainKey: input.chainKey,
        })
      : Coin.from({
          ...nativeCurrency,
          chainKey: input.chainKey,
        }),
  };
  return network;
});

export type SerializedNetwork = z.infer<typeof serializedNetworkSchema>;
