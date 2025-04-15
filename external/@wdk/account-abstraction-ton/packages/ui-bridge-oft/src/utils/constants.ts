import {ChainKey} from '@layerzerolabs/lz-definitions';

// USDT Specific
export const POOL_TOKEN_CHAINS: string[] = [
  ChainKey.ETHEREUM,
  ChainKey.ARBITRUM,
  ChainKey.ARBITRUM_SEPOLIA,
  ChainKey.SEPOLIA,
  ChainKey.TRON,
  ChainKey.TRONDEV,
  ChainKey.TRON_TESTNET,
  ChainKey.CELO,
  // ChainKey comes from lz-definitions. The version we use doesn't have ton. @layerzerolabs/lz-solana-sdk-v2 is preventing
  // an easy upgrade of lz-definitions.
  'ton',
];
