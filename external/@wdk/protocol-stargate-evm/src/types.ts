import { Contract } from 'ethers'

/**
 * Configuration options for BridgeStargate constructor
 */
export interface BridgeStargateOptions {
  /** Source chain identifier (e.g., 'ethereum', 'bsc') */
  chain: string
  /** RPC provider URL for the source chain */
  providerUrl: string
}

/**
 * Parameters for sending tokens across chains
 */
export interface SendParams {
  /** Destination endpoint ID */
  dstEid: number
  /** Destination address in bytes32 format */
  to: Uint8Array
  /** Amount in local decimals */
  amountLD: number
  /** Minimum amount to receive (with slippage tolerance) */
  minAmountLD: number
  /** Additional options in bytes format */
  extraOptions: Uint8Array
  /** Composed message (empty in this implementation) */
  composeMsg: Uint8Array
  /** OFT command (empty in this implementation) */
  oftCmd: Uint8Array
}

/**
 * Transaction data for sending tokens across chains
 */
export interface TransactionData {
  /** Encoded function call data */
  data: string
  /** Target contract address */
  to: string
  /** Native fee amount to send with the transaction */
  value: number
}

/**
 * BridgeStargate class interface
 */
export interface IBridgeStargate {
  /** Builds parameters for sending tokens across chains */
  buildSendParam(
    chain: string,
    address: string,
    amount: number,
    nativeTokenDropAmount?: number
  ): SendParams

  /** Gets the Stargate OFT contract instance */
  getContract(): Contract

  /** Prepares transaction data for sending tokens */
  send(
    chain: string,
    address: string,
    amount: number,
    nativeFee: number,
    refundAddress: string,
    nativeTokenDropAmount?: number
  ): TransactionData

  /** Simulates a cross-chain transfer and returns the estimated fee */
  quoteSend(
    chain: string,
    address: string,
    amount: number,
    nativeTokenDropAmount?: number
  ): Promise<number>
} 