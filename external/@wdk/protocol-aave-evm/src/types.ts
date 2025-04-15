/**
 * Supported chains for Aave protocol
 */
export type SupportedChain = 'ethereum' | 'arbitrum' | 'polygon' | 'avalanche';

/**
 * Configuration options for the LendingAave constructor
 */
export interface AaveOptions {
  /** The chain identifier */
  chain: SupportedChain;
  /** The Web3 provider URL */
  providerUrl: string;
}

/**
 * User account data returned from Aave protocol
 */
export interface UserAccountData {
  /** Total collateral in base units */
  totalCollateralBase: number;
  /** Total debt in base units */
  totalDebtBase: number;
  /** Available borrows in base units */
  availableBorrowsBase: number;
  /** Current liquidation threshold */
  currentLiquidationThreshold: number;
  /** Loan to Value ratio */
  ltv: number;
  /** Health factor */
  healthFactor: number;
}

/**
 * Transaction data for Aave protocol operations
 */
export interface TransactionData {
  /** Encoded function data */
  data: string;
  /** Target contract address */
  to: string;
  /** Value to send with transaction */
  value: number;
} 