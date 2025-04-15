# WDK Protocol Allbridge EVM

A TypeScript/JavaScript package for building transaction data for the Allbridge protocol on EVM-compatible chains. This package is part of the WDK (Wallet Development Kit) and provides utilities for constructing cross-chain token transfer transactions.

> **Note**: This package only provides transaction data construction. To actually execute these transactions, you need to use it in combination with other WDK packages like `@wdk/account-abstraction-evm` for wallet management and transaction signing.

## Features

- Build transaction data for cross-chain token transfers between EVM-compatible chains
- Support for multiple chains (Ethereum, Arbitrum, Berachain, Ink)
- Gas cost estimation for cross-chain transactions
- Bridging fee calculation in native tokens or source tokens
- TypeScript type definitions available

## Installation

```bash
npm install @wdk/protocol-allbridge-evm
# or
yarn add @wdk/protocol-allbridge-evm
```

## Dependencies

- ethers.js (^6.0.0)
- bs58 (^5.0.0)

## Usage

```typescript
import { BridgeAllbridge } from '@wdk/protocol-allbridge-evm';
import { WDKWalletManagementEVM } from '@wdk/wallet-management-evm';

// Initialize the bridge with chain and provider details
const allbridgeBridge = new BridgeAllbridge({
  chain: 'ethereum', // Supported chains: ethereum, arbitrum, berachain, ink
  providerUrl: 'YOUR_PROVIDER_URL', // Your Web3 provider URL (e.g., Infura, Alchemy)
});

// Initialize wallet management (required for actual transaction execution)
const walletManager = new WDKWalletManagementEVM();

// Get transaction cost for cross-chain transfer
const txCost = await allbridgeBridge.getTransactionCost('arbitrum');

// Get bridging cost in tokens
const bridgingCost = await allbridgeBridge.getBridgingCostInTokens('arbitrum');

// Build transaction data for cross-chain transfer
const txData = await allbridgeBridge.swapAndBridge(
  'arbitrum',
  '0x...', // recipient address
  '1000000000000000000', // amount (1 USDT with 18 decimals)
  0 // feeTokenAmount (optional)
);

// Build transaction data for receiving tokens
const receiveData = allbridgeBridge.receiveTokens(
  '1000000000000000000', // amount
  '0x...', // recipient address
  'ethereum', // source chain
  '990000000000000000' // minimum receive amount (slippage protection)
);

// Execute the transaction using wallet management
// Note: This is just an example. Actual implementation depends on your wallet management setup
const wallet = await walletManager.getWallet();
const tx = await wallet.sendTransaction(txData);
await tx.wait();
```

## API Reference

### Constructor

```typescript
constructor(opts: {
  chain: 'ethereum' | 'arbitrum' | 'berachain' | 'ink';
  providerUrl: string;
})
```

### `getTransactionCost(chain: string)`

Get the gas cost of a transaction on another chain in the current chain's native token.

```typescript
async getTransactionCost(chain: string): Promise<bigint>
```

### `getBridgingCostInTokens(chain: string)`

Get the bridging cost in source tokens for a cross-chain transfer.

```typescript
async getBridgingCostInTokens(chain: string): Promise<bigint>
```

### `swapAndBridge(chain: string, recipient: string, amount: string, feeTokenAmount?: string)`

Builds transaction data for initiating a swap and bridge process of a given token for a token on another blockchain.

```typescript
async swapAndBridge(
  chain: string,
  recipient: string,
  amount: string,
  feeTokenAmount?: string
): Promise<{
  data: string;
  to: string;
  value: bigint;
}>
```

### `receiveTokens(amount: bigint, recipient: string, sourceChain: string, receiveAmountMin: bigint)`

Builds transaction data for completing the bridging process by sending the tokens on the destination chain to the recipient.

```typescript
receiveTokens(
  amount: bigint,
  recipient: string,
  sourceChain: string,
  receiveAmountMin: bigint
): string
```

## TypeScript Support

TypeScript type definitions are available in the `src/types.ts` file. You can import them like this:

```typescript
import type { SupportedChain, BridgeOptions, TransactionData } from '@wdk/protocol-allbridge-evm/src/types';
```

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
- Failed bridging cost calculations
- Invalid recipient addresses
- Insufficient funds for bridging fees

## License

Apache License 2.0

