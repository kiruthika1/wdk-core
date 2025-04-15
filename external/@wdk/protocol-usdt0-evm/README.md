# WDK Protocol USDT0 EVM

A TypeScript/JavaScript package for building transaction data for the USDT0 protocol on EVM-compatible chains. This package is part of the WDK (Wallet Development Kit) and provides utilities for constructing USDT0 token transactions and bridge operations.

> **Note**: This package only provides transaction data construction. To actually execute these transactions, you need to use it in combination with other WDK packages like `@wdk/account-abstraction-evm` for wallet management and transaction signing.

## Features

- Build transaction data for USDT0 token operations on EVM-compatible chains
- Support for multiple chains (Ethereum, Arbitrum, Berachain, Ink)
- Bridge functionality for cross-chain USDT0 transfers
- Gas cost estimation for USDT0 transactions
- TypeScript type definitions available

## Installation

```bash
npm install @wdk/protocol-usdt0-evm
# or
yarn add @wdk/protocol-usdt0-evm
```

## Dependencies

- ethers.js (^6.0.0)

## Usage

```typescript
import { BridgeUSDT0, BridgeHelperUSDT0, BridgeTronUSDT0 } from '@wdk/protocol-usdt0-evm';
import { WDKWalletManagementEVM } from '@wdk/wallet-management-evm';

// Initialize the bridge with chain and provider details
const bridge = new BridgeUSDT0({
  chain: 'ethereum', // Supported chains: ethereum, arbitrum, berachain, ink
  providerUrl: 'YOUR_PROVIDER_URL', // Your Web3 provider URL (e.g., Infura, Alchemy)
});

// Initialize bridge helper for additional functionality
const bridgeHelper = new BridgeHelperUSDT0(bridge);

// Initialize Tron bridge if needed
const tronBridge = new BridgeTronUSDT0({
  // Tron-specific configuration
});

// Get transaction cost for bridge operation
const txCost = await bridge.getTransactionCost();

// Build transaction data for cross-chain transfer
const txData = await bridge.transfer(
  '0x...', // recipient address
  '1000000000000000000' // amount (1 USDT0 with 18 decimals)
);

// Execute the transaction using wallet management
// Note: This is just an example. Actual implementation depends on your wallet management setup
const wallet = await walletManager.getWallet();
const tx = await wallet.sendTransaction(txData);
await tx.wait();
```

## API Reference

### BridgeUSDT0 Constructor

```typescript
constructor(opts: {
  chain: 'ethereum' | 'arbitrum' | 'berachain' | 'ink';
  providerUrl: string;
})
```

### BridgeHelperUSDT0 Constructor

```typescript
constructor(bridge: BridgeUSDT0)
```

### BridgeTronUSDT0 Constructor

```typescript
constructor(opts: BridgeTronOptions)
```

### `getTransactionCost()`

Get the gas cost of a bridge transaction in the current chain's native token.

```typescript
async getTransactionCost(): Promise<bigint>
```

### `transfer(recipient: string, amount: string)`

Builds transaction data for transferring USDT0 tokens to a recipient.

```typescript
async transfer(
  recipient: string,
  amount: string
): Promise<{
  data: string;
  to: string;
  value: bigint;
}>
```

## TypeScript Support

TypeScript type definitions are available in the `src/types.ts` file. The package provides comprehensive type definitions for all its functionality:

### Core Types

```typescript
import type {
  SupportedChain,
  BridgeOptions,
  BridgeTronOptions,
  SendParam,
  FeeQuote,
  TransactionData,
  ChainConfig,
  BridgeError
} from '@wdk/protocol-usdt0-evm/src/types';
```

### Contract Interfaces

```typescript
import type {
  OFTContract,
  TransactionValueHelperContract,
  TronContract,
  TronCallOptions
} from '@wdk/protocol-usdt0-evm/src/types';
```

### Type Definitions

- `SupportedChain`: Supported chains for USDT0 bridge operations
- `BridgeOptions`: Base options for bridge initialization
- `BridgeTronOptions`: Options for Tron bridge initialization
- `SendParam`: Parameters for cross-chain transfer
- `FeeQuote`: Fee structure for cross-chain transfer
- `TransactionData`: Transaction data structure
- `ChainConfig`: Chain-specific configuration
- `BridgeError`: Error types for bridge operations
- `OFTContract`: Interface for the OFT contract
- `TransactionValueHelperContract`: Interface for the transaction value helper contract
- `TronContract`: Interface for the Tron contract
- `TronCallOptions`: Options for Tron contract calls

## Supported Chains

- Ethereum
- Arbitrum
- Berachain
- Ink

## Error Handling

The package includes comprehensive error handling for common scenarios:

- Invalid chain identifiers
- Invalid provider URLs
- Failed transaction cost calculations
- Invalid recipient addresses
- Insufficient funds for gas fees
- Bridge-specific errors

## License

Apache License 2.0
