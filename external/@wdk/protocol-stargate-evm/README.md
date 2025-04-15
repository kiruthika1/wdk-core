# Wallet Bridge Stargate EVM

A TypeScript/JavaScript library for cross-chain USDT transfers using the Stargate protocol on EVM-compatible chains.

## Features

- Cross-chain USDT transfers between EVM-compatible chains
- Native fee estimation for cross-chain transactions
- Support for native token airdrops on destination chains
- TypeScript support with comprehensive type definitions
- Built on LayerZero's Stargate protocol

## Supported Chains

- Ethereum
- Polygon
- Avalanche

## Installation

```bash
npm install @wdk/protocol-stargate-evm
```

## Usage

```typescript
import { BridgeStargate } from '@wdk/protocol-stargate-evm'

// Initialize the bridge
const bridge = new BridgeStargate({
  chain: 'ethereum', // Source chain
  providerUrl: 'YOUR_RPC_URL'
})

// Estimate fees for a cross-chain transfer
const nativeFee = await bridge.quoteSend(
  'polygon', // Destination chain
  '0x...', // Destination address
  '1000000' // Amount in USDT (6 decimals)
)

// Prepare transaction data for sending USDT
const txData = bridge.send(
  'polygon', // Destination chain
  '0x...', // Destination address
  '1000000', // Amount in USDT (6 decimals)
  nativeFee, // Estimated native fee
  '0x...', // Refund address for excess fees
  '1000000' // Optional: Native token drop amount on destination chain
)
```

## API Reference

### Constructor

```typescript
new BridgeStargate(options: BridgeStargateOptions)
```

#### Parameters

- `options`: Configuration object
  - `chain`: Source chain identifier (e.g., 'ethereum', 'polygon', 'avalanche')
  - `providerUrl`: RPC provider URL for the source chain

### Methods

#### `buildSendParam`

Builds parameters for sending tokens across chains.

```typescript
buildSendParam(
  chain: string,
  address: string,
  amount: number,
  nativeTokenDropAmount?: number
): SendParams
```

#### `getContract`

Returns an ethers Contract instance for the Stargate OFT contract.

```typescript
getContract(): Contract
```

#### `send`

Prepares transaction data for sending tokens.

```typescript
send(
  chain: string,
  address: string,
  amount: number,
  nativeFee: number,
  refundAddress: string,
  nativeTokenDropAmount?: number
): TransactionData
```

#### `quoteSend`

Simulates a cross-chain transfer and returns the estimated fee.

```typescript
quoteSend(
  chain: string,
  address: string,
  amount: number,
  nativeTokenDropAmount?: number
): Promise<number>
```

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

### Testing

Run the test suite:

```bash
npm test
```

## License

Apache License 2.0

<p align="center" width="100">
<a href="https://github.com/tetherto/lib-wallet">
<img src="https://github.com/rbndg/lib-wallet/blob/main/docs/logo.svg" width="200"/>
</a>
</p>


# 🚀 lib-wallet-bridge-stargate

Stargate methods for the wallet library. Using lib-wallet-pay-eth and Web3 backend.

## 💼 Wallet SDK
This library is part of the [Wallet SDK](https://github.com/tetherto/lib-wallet)  
See the module in action [here](https://github.com/tetherto/lib-wallet/tree/main/example)

## 🚀 How to use

Initialize `WalletBridgeStargatePoolUSDT` passing a valid chain and `providerUrl`:

```js
const walletBridge = new WalletBridgeStargatePoolUSDT({
  chain: 'ethereum', // Supported chains: ethereum, arbitrum, berachain, ink
  providerUrl: 'YOUR_PROVIDER_URL', // Your Web3 provider URL (e.g., Infura, Alchemy)
})

const txData = walletBridge.send('arbitrum', DEST_ADDRESS, AMOUNT)
