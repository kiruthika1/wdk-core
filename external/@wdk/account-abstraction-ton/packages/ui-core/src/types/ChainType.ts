export const ChainType = {
  EVM: 'evm',
  APTOS: 'aptos',
  SOLANA: 'solana',
  COSMOS: 'cosmos',
  TON: 'ton',
  TRON: 'tron',
} as const;

// Type is being redefined here
// eslint-disable-next-line
export type ChainType = (typeof ChainType)[keyof typeof ChainType] | (string & {});
