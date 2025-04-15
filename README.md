# WDK Core

A comprehensive Wallet Development Kit (WDK) that provides unified interfaces for managing wallets, performing account abstraction, and executing cross-chain operations across multiple blockchains.

## Features

- **Multi-Chain Support**: Native support for EVM chains (Ethereum, Arbitrum, Polygon) and TON blockchain
- **Account Abstraction**: Gasless transactions and smart account management
- **Wallet Management**: HD wallet creation and management with BIP-39 support
- **Cross-Chain Operations**: Bridge tokens between different chains
- **Token Operations**: Transfer, swap, and manage tokens across supported chains
- **TypeScript Support**: Full type definitions for better development experience

## Installation

```bash
npm install https://github.com/tetherto/wdk-core
# or
yarn add https://github.com/tetherto/wdk-core
```

## Quick Start

```typescript
import WdkManager from '@wdk/core';

// Initialize with seed phrase and configuration
const wdk = new WdkManager(
  // Seed phrase (can be a single phrase or different phrases per chain)
  "your twelve word mnemonic phrase here",
  // Account abstraction configuration
  {
    ethereum: {
      rpc: "YOUR_ETHEREUM_RPC_URL",
      safe: {
        bundlerUrl: "YOUR_BUNDLER_URL",
        paymasterUrl: "YOUR_PAYMASTER_URL",
        paymasterAddress: "YOUR_PAYMASTER_ADDRESS",
        paymasterToken: {
          address: "YOUR_PAYMASTER_TOKEN_ADDRESS"
        }
      }
    },
    ton: {
      tonApiKey: "YOUR_TON_API_KEY",
      tonApiEndpoint: "YOUR_TON_API_ENDPOINT",
      tonCenterApiKey: "YOUR_TON_CENTER_API_KEY",
      tonCenterEndpoint: "YOUR_TON_CENTER_ENDPOINT"
    }
  }
);

// Get abstracted address for an account
const address = await wdk.getAbstractedAddress("ethereum", 0);

// Transfer tokens
const transferResult = await wdk.transfer("ethereum", 0, {
  recipient: "0x...",
  token: "0x...",
  amount: 1000000
});

// Bridge tokens to another chain
const bridgeResult = await wdk.bridge("ethereum", 0, {
  targetChain: "arbitrum",
  recipient: "0x...",
  amount: 1000000
});
```

## API Reference

### WdkManager

The main class that provides unified interfaces for wallet operations.

#### Constructor

```typescript
constructor(seed: string | Seeds, accountAbstractionConfig: AccountAbstractionConfig)
```

#### Methods

- `getAbstractedAddress(blockchain: string, accountIndex: number): Promise<string>`
- `transfer(blockchain: string, accountIndex: number, options: TransferOptions): Promise<TransferResult>`
- `quoteTransfer(blockchain: string, accountIndex: number, options: TransferOptions): Promise<Omit<TransferResult, "hash">>`
- `swap(blockchain: string, accountIndex: number, options: SwapOptions): Promise<SwapResult>`
- `quoteSwap(blockchain: string, accountIndex: number, options: SwapOptions): Promise<Omit<SwapResult, "hash">>`
- `bridge(blockchain: string, accountIndex: number, options: BridgeOptions): Promise<BridgeResult>`
- `quoteBridge(blockchain: string, accountIndex: number, options: BridgeOptions): Promise<Omit<BridgeResult, "hash">>`

### Static Methods

- `getRandomSeedPhrase(): string`
- `isValidSeedPhrase(seed: string): boolean`

## Supported Blockchains

### EVM Chains
- Ethereum
- Arbitrum
- Polygon

### TON
- TON Mainnet

## Dependencies

- `@wdk/account-abstraction-evm`: Account abstraction for EVM chains
- `@wdk/account-abstraction-ton`: Account abstraction for TON blockchain
- `@wdk/wallet-management-evm`: Wallet management for EVM chains
- `@wdk/wallet-management-ton`: Wallet management for TON blockchain
- `bip39`: BIP-39 mnemonic phrase generation and validation

## Development

### Prerequisites

- Node.js >= 16
- npm >= 7

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Building Documentation

```bash
npm run docs
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Security

For security concerns, please email security@tether.to