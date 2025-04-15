# WDK Account Abstraction EVM

This module provides account abstraction functionality for EVM chains using Safe Protocol Kit. 

## Installation

```bash
npm install @wdk/account-abstraction-evm
```

## Usage

### JavaScript

```javascript
import { WDKAccountAbstractionEVM } from '@wdk/account-abstraction-evm';
import { JsonRpcProvider } from 'ethers';

// Initialize the service
const provider = new JsonRpcProvider('YOUR_RPC_URL');
const safeConfig = {
  bundlerUrl: 'YOUR_BUNDLER_URL',
  paymasterUrl: 'YOUR_PAYMASTER_URL',
  paymasterAddress: 'YOUR_PAYMASTER_ADDRESS',
  paymasterToken: {
    address: 'YOUR_PAYMASTER_TOKEN_ADDRESS',
    decimals: 6,
    symbol: 'USDC'
  },
  minimumPaymasterAllowance: 1000000,
  maximumPremiumOnGasCost: 100,
  entrypointAddress: 'YOUR_ENTRYPOINT_ADDRESS',
  paymasterTokenOracleAddress: 'YOUR_ORACLE_ADDRESS',
  sendMaxFee: 10000000,
  swapMaxFee: 10000000,
  bridgeMaxFee: 10000000
};

const aaService = new WDKAccountAbstractionEVM(provider, safeConfig);
```

### TypeScript

```typescript
import { 
  WDKAccountAbstractionEVM, 
  SafeConfig, 
  BasicWallet, 
  SendOptions,
  TransactionResult,
  QuoteResult 
} from '@wdk/account-abstraction-evm';
import { JsonRpcProvider } from 'ethers';

// Configuration with type safety
const safeConfig: SafeConfig = {
  bundlerUrl: 'YOUR_BUNDLER_URL',
  paymasterUrl: 'YOUR_PAYMASTER_URL',
  paymasterAddress: 'YOUR_PAYMASTER_ADDRESS',
  paymasterToken: {
    address: 'YOUR_PAYMASTER_TOKEN_ADDRESS',
    decimals: 6,
    symbol: 'USDC'
  },
  minimumPaymasterAllowance: 1000000,
  maximumPremiumOnGasCost: 100,
  entrypointAddress: 'YOUR_ENTRYPOINT_ADDRESS',
  paymasterTokenOracleAddress: 'YOUR_ORACLE_ADDRESS',
  sendMaxFee: 10000000,
  swapMaxFee: 10000000,
  bridgeMaxFee: 10000000
};

const provider = new JsonRpcProvider('YOUR_RPC_URL');
const aaService = new WDKAccountAbstractionEVM(provider, safeConfig);

// Example wallet
const wallet: BasicWallet = {
  address: 'YOUR_WALLET_ADDRESS',
  privateKey: 'YOUR_PRIVATE_KEY'
};

// Get Safe4337Pack instance
const safe4337Pack = await aaService.getSafe4337Pack(wallet);

// Get abstracted address
const abstractedAddress: string = await aaService.getAbstractedAddress(safe4337Pack);

// Send tokens with type safety
const sendOptions: SendOptions = {
  safe4337Pack,
  token: 'TOKEN_ADDRESS',
  amount: '1000000',
  receiver: 'RECEIVER_ADDRESS'
};

const sendResult: TransactionResult = await aaService.send(sendOptions);

// Quote send operation
const quoteResult: QuoteResult = await aaService.quoteSend(sendOptions);
```

## Bridge Operations

For bridge operations between chains, use the `WDKBridgeEVM` class:

```typescript
import { WDKBridgeEVM, BridgeOptions } from '@wdk/account-abstraction-evm';

const bridgeService = new WDKBridgeEVM(provider, safeConfig);

const bridgeOptions: BridgeOptions = {
  safe4337Pack,
  chain: 'TARGET_CHAIN_ID',
  token: 'TOKEN_ADDRESS',
  amount: '1000000',
  receiver: 'RECEIVER_ADDRESS',
  nativeTokenDropAmount: '100000' // optional
};

const bridgeResult = await bridgeService.bridge(bridgeOptions);
const bridgeQuote = await bridgeService.quoteBridge(bridgeOptions);
```

## Types

The package exports the following TypeScript interfaces:

- `SafeConfig`: Configuration for Safe Protocol Kit
- `BasicWallet`: Simple wallet interface with address and private key
- `Safe4337Pack`: Safe Protocol Kit instance interface
- `SendOptions`: Options for send operations
- `BridgeOptions`: Options for bridge operations
- `TransactionResult`: Result of transaction operations
- `QuoteResult`: Result of quote operations
- `WDKBaseEVMInterface`: Base interface for EVM operations
- `WDKAccountAbstractionEVMInterface`: Interface for account abstraction operations
- `WDKBridgeEVMInterface`: Interface for bridge operations

## API Methods

### WDKAccountAbstractionEVM

- `getSafe4337Pack(wallet: BasicWallet): Promise<Safe4337Pack>`
- `getAbstractedAddress(safe4337Pack: Safe4337Pack): Promise<string>`
- `getGaslessTransactionReceipt(safe4337Pack: Safe4337Pack, id: string): Promise<any>`
- `send(opts: SendOptions): Promise<TransactionResult>`
- `quoteSend(opts: SendOptions): Promise<QuoteResult>`

### WDKBridgeEVM

- `bridge(opts: BridgeOptions): Promise<TransactionResult>`
- `quoteBridge(opts: BridgeOptions): Promise<QuoteResult>`

## License

MIT 

## Architecture

The package is organized into several service classes:

- `WDKBaseEVM`: Base class containing shared functionality for EVM operations
- `WDKSendEVM`: Service for handling token transfer operations
- `WDKSwapEVM`: Service for handling token swap operations using ParaSwap Protocol
- `WDKBridgeEVM`: Service for handling cross-chain bridge operations

### JavaScript

```javascript
import { WDKSendEVM, WDKSwapEVM, WDKBridgeEVM } from '@wdk/account-abstraction-evm';
import { JsonRpcProvider } from 'ethers';

// Initialize the services
const provider = new JsonRpcProvider('YOUR_RPC_URL');
const safeConfig = {
  bundlerUrl: 'YOUR_BUNDLER_URL',
  paymasterUrl: 'YOUR_PAYMASTER_URL',
  paymasterAddress: 'YOUR_PAYMASTER_ADDRESS',
  paymasterToken: {
    address: 'YOUR_PAYMASTER_TOKEN_ADDRESS',
    decimals: 6,
    symbol: 'USDC'
  },
  minimumPaymasterAllowance: 1000000,
  maximumPremiumOnGasCost: 100,
  entrypointAddress: 'YOUR_ENTRYPOINT_ADDRESS',
  paymasterTokenOracleAddress: 'YOUR_ORACLE_ADDRESS',
  sendMaxFee: 10000000,
  swapMaxFee: 10000000,
  bridgeMaxFee: 10000000
};

// Create service instances
const sendService = new WDKSendEVM(provider, safeConfig);
const swapService = new WDKSwapEVM(provider, safeConfig);
const bridgeService = new WDKBridgeEVM(provider, safeConfig);
```

### TypeScript

```typescript
import { 
  WDKSendEVM,
  WDKSwapEVM, 
  WDKBridgeEVM,
  SafeConfig, 
  BasicWallet, 
  SendOptions,
  SwapOptions,
  BridgeOptions,
  TransactionResult,
  QuoteResult 
} from '@wdk/account-abstraction-evm';
import { JsonRpcProvider } from 'ethers';

// Configuration with type safety
const safeConfig: SafeConfig = {
  bundlerUrl: 'YOUR_BUNDLER_URL',
  paymasterUrl: 'YOUR_PAYMASTER_URL',
  paymasterAddress: 'YOUR_PAYMASTER_ADDRESS',
  paymasterToken: {
    address: 'YOUR_PAYMASTER_TOKEN_ADDRESS',
    decimals: 6,
    symbol: 'USDC'
  },
  minimumPaymasterAllowance: 1000000,
  maximumPremiumOnGasCost: 100,
  entrypointAddress: 'YOUR_ENTRYPOINT_ADDRESS',
  paymasterTokenOracleAddress: 'YOUR_ORACLE_ADDRESS',
  sendMaxFee: 10000000,
  swapMaxFee: 10000000,
  bridgeMaxFee: 10000000
};

const provider = new JsonRpcProvider('YOUR_RPC_URL');

// Create service instances
const sendService = new WDKSendEVM(provider, safeConfig);
const swapService = new WDKSwapEVM(provider, safeConfig);
const bridgeService = new WDKBridgeEVM(provider, safeConfig);

// Example wallet
const wallet: BasicWallet = {
  address: 'YOUR_WALLET_ADDRESS',
  privateKey: 'YOUR_PRIVATE_KEY'
};

// Get Safe4337Pack instance
const safe4337Pack = await sendService.getSafe4337Pack(wallet);

// Get abstracted address
const abstractedAddress: string = await sendService.getAbstractedAddress(safe4337Pack);

// Send tokens with type safety
const sendOptions: SendOptions = {
  safe4337Pack,
  token: 'TOKEN_ADDRESS',
  amount: '1000000',
  receiver: 'RECEIVER_ADDRESS'
};

const sendResult: TransactionResult = await sendService.send(sendOptions);
const sendQuote: QuoteResult = await sendService.quoteSend(sendOptions);

// Swap tokens
const swapOptions: SwapOptions = {
  safe4337Pack,
  tokenIn: 'TOKEN_IN_ADDRESS',
  tokenOut: 'TOKEN_OUT_ADDRESS',
  tokenInAmount: '1000000'
};

const swapResult: TransactionResult = await swapService.swap(swapOptions);
const swapQuote: QuoteResult = await swapService.quoteSwap(swapOptions);

// Bridge tokens
const bridgeOptions: BridgeOptions = {
  safe4337Pack,
  chain: 'TARGET_CHAIN_ID',
  token: 'TOKEN_ADDRESS',
  amount: '1000000',
  receiver: 'RECEIVER_ADDRESS',
  nativeTokenDropAmount: '100000' // optional
};

const bridgeResult: TransactionResult = await bridgeService.bridge(bridgeOptions);
const bridgeQuote: QuoteResult = await bridgeService.quoteBridge(bridgeOptions);
```

## Service Classes

### WDKBaseEVM

Base class containing shared functionality for EVM operations:

- `getSafe4337Pack(wallet: BasicWallet): Promise<Safe4337Pack>`
- `getAbstractedAddress(safe4337Pack: Safe4337Pack): Promise<string>`
- `getGaslessTransactionReceipt(safe4337Pack: Safe4337Pack, id: string): Promise<any>`

### WDKSendEVM

Service for handling token transfer operations:

- `send(opts: SendOptions): Promise<TransactionResult>`
- `quoteSend(opts: SendOptions): Promise<QuoteResult>`

### WDKSwapEVM

Service for handling token swap operations using ParaSwap Protocol:

- `swap(opts: SwapOptions): Promise<TransactionResult>`
- `quoteSwap(opts: SwapOptions): Promise<QuoteResult>`

### WDKBridgeEVM

Service for handling cross-chain bridge operations:

- `bridge(opts: BridgeOptions): Promise<TransactionResult>`
- `quoteBridge(opts: BridgeOptions): Promise<QuoteResult>` 