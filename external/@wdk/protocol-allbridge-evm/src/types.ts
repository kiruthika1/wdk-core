/**
 * Supported chain identifiers for the Allbridge protocol
 */
export type SupportedChain = 'ethereum' | 'arbitrum' | 'berachain' | 'ink';

/**
 * Configuration options for the AllbridgeBridge constructor
 */
export interface BridgeOptions {
  /** The source chain identifier */
  chain: SupportedChain;
  /** The Web3 provider URL */
  providerUrl: string;
}

/**
 * Transaction data returned by swapAndBridge
 */
export interface TransactionData {
  /** The encoded function data */
  data: string;
  /** The target contract address */
  to: string;
  /** The transaction value in wei */
  value: bigint;
}

/**
 * Utility functions for the Allbridge protocol
 */
export interface AllbridgeUtils {
  /**
   * Generates a random nonce for transaction identification
   * @returns A random number between 0 and 2^32 - 1
   */
  getNonce(): number;
} 