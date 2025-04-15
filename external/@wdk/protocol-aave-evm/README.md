# WDK Protocol Aave EVM

A TypeScript/JavaScript package for building transaction data for the Aave lending protocol on EVM-compatible chains. This package is part of the WDK (Wallet Development Kit) and provides utilities for constructing lending and borrowing transactions.

> **Note**: This package only provides transaction data construction. To actually execute these transactions, you need to use it in combination with other WDK packages like `@wdk/account-abstraction-evm` for wallet management and transaction signing.

## Features

- Build transaction data for Aave lending protocol operations on EVM-compatible chains
- Support for multiple chains (Ethereum, Arbitrum, Polygon, Avalanche)
- Supply and withdraw assets
- Borrow and repay assets
- Manage collateral settings
- Get user account data and health factors
- TypeScript type definitions available

## Installation

```bash
npm install @wdk/protocol-aave-evm
# or
yarn add @wdk/protocol-aave-evm
```

## Dependencies

- ethers.js (^6.0.0)

## Usage

```typescript
import { LendingAave } from '@wdk/protocol-aave-evm';
import { WDKWalletManagementEVM } from '@wdk/wallet-management-evm';

// Initialize the Aave lending protocol with chain and provider details
const aave = new LendingAave({
  chain: 'ethereum', // Supported chains: ethereum, arbitrum, polygon, avalanche
  providerUrl: 'YOUR_PROVIDER_URL', // Your Web3 provider URL (e.g., Infura, Alchemy)
});

// Get user account data
const accountData = await aave.getUserAccountData('0x...'); // User address

// Supply assets to Aave
const supplyTx = aave.supply(
  '0x...', // Token address
  '1000000000000000000', // Amount (1 ETH with 18 decimals)
  '0x...' // Recipient address (use sender's address for self-supply)
);

// Enable/disable collateral
const collateralTx = aave.setUserUseReserveAsCollateral(
  '0x...', // Token address
  true // Use as collateral
);

// Withdraw assets from Aave
const withdrawTx = aave.withdraw(
  '0x...', // Token address
  '1000000000000000000', // Amount
  '0x...' // Recipient address
);

// Borrow assets from Aave
const borrowTx = aave.borrow(
  '0x...', // Token address
  '1000000000000000000', // Amount
  '0x...' // Borrower address
);

// Repay borrowed assets
const repayTx = aave.repay(
  '0x...', // Token address
  '1000000000000000000', // Amount
  '0x...' // Borrower address
);

// Execute transactions using wallet management
// Note: This is just an example. Actual implementation depends on your wallet management setup
const wallet = await walletManager.getWallet();
const tx = await wallet.sendTransaction(supplyTx);
await tx.wait();
```

## API Reference

### Constructor

```typescript
constructor(opts: {
  chain: 'ethereum' | 'arbitrum' | 'polygon' | 'avalanche';
  providerUrl: string;
})
```

### `getUserAccountData(address: string)`

Get the user's account data across all reserves.

```typescript
async getUserAccountData(address: string): Promise<{
  totalCollateralBase: number;
  totalDebtBase: number;
  availableBorrowsBase: number;
  currentLiquidationThreshold: number;
  ltv: number;
  healthFactor: number;
}>
```

### `supply(tokenAddress: string, amount: number, onBehalfOf: string)`

Build transaction data for supplying assets to Aave.

```typescript
supply(
  tokenAddress: string,
  amount: number,
  onBehalfOf: string
): {
  data: string;
  to: string;
  value: number;
}
```

### `setUserUseReserveAsCollateral(tokenAddress: string, useAsCollateral: boolean)`

Build transaction data for enabling/disabling collateral usage.

```typescript
setUserUseReserveAsCollateral(
  tokenAddress: string,
  useAsCollateral: boolean
): {
  data: string;
  to: string;
  value: number;
}
```

### `withdraw(tokenAddress: string, amount: number, to: string)`

Build transaction data for withdrawing assets from Aave.

```typescript
withdraw(
  tokenAddress: string,
  amount: number,
  to: string
): {
  data: string;
  to: string;
  value: number;
}
```

### `borrow(tokenAddress: string, amount: number, onBehalfOf: string)`

Build transaction data for borrowing assets from Aave.

```typescript
borrow(
  tokenAddress: string,
  amount: number,
  onBehalfOf: string
): {
  data: string;
  to: string;
  value: number;
}
```

### `repay(tokenAddress: string, amount: number, onBehalfOf: string)`

Build transaction data for repaying borrowed assets to Aave.

```typescript
repay(
  tokenAddress: string,
  amount: number,
  onBehalfOf: string
): {
  data: string;
  to: string;
  value: number;
}
```

## TypeScript Support

TypeScript type definitions are available in the `src/types.ts` file. You can import them like this:

```typescript
import type { SupportedChain, AaveOptions, UserAccountData, TransactionData } from '@wdk/protocol-aave-evm/src/types';
```

## Supported Chains

- Ethereum
- Arbitrum
- Polygon
- Avalanche

## License

Apache License 2.0