export const Stage = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  SANDBOX: 'sandbox',
} as const;

export type Stage = (typeof Stage)[keyof typeof Stage] | (string & {});
