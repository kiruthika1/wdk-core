# WDK Account Abstraction TON

This module provides account abstraction functionality for TON blockchain, enabling gasless transactions and cross-chain bridging capabilities.

## Installation

```bash
npm install @wdk/account-abstraction-ton
```

## Development Setup

1. Navigate to the package directory:
```bash
cd packages/@wdk/account-abstraction-ton
```

2. Install dependencies and build the package:
```bash
yarn -W
turbo run build
```

3. Return to your main project directory and install dependencies:
```bash
cd ../../../
yarn
```

## Usage

```javascript
import { WDKAccountAbstractionTON } from '@wdk/account-abstraction-ton';

// Initialize the service
const config = {
  tonApiEndpoint: 'YOUR_TON_API_ENDPOINT', // Optional, defaults to 'https://tonapi.io/v2'
  tonCenterEndpoint: 'YOUR_TON_CENTER_ENDPOINT', // Optional, defaults to 'https://toncenter.com/api/v2/jsonRPC'
  tonApiKey: 'YOUR_TON_API_KEY', // Optional
  tonCenterApiKey: 'YOUR_TON_CENTER_API_KEY' // Optional
};

const aaService = new WDKAccountAbstractionTON(config);

// Initialize wallet from key pair
const wallet = await aaService.initializeWallet(keyPair);

// Send gasless transaction
const result = await aaService.send({
  publicKey: wallet.publicKey,
  privateKey: wallet.privateKey,
  destination: 'RECEIVER_ADDRESS',
  amount: 1000000,
  jettonMaster: 'JETTON_MASTER_ADDRESS',
  simulate: false
});

// Quote send operation
const quote = await aaService.quoteSend({
  publicKey: wallet.publicKey,
  destination: 'RECEIVER_ADDRESS',
  amount: 1000000,
  jettonMaster: 'JETTON_MASTER_ADDRESS'
});

// Bridge tokens to other chains
const bridgeResult = await aaService.bridge({
  address: 'SOURCE_ADDRESS',
  receiver: 'DESTINATION_ADDRESS',
  chain: 'ethereum', // or 'arbitrum', 'tron'
  tokenAddress: 'TOKEN_ADDRESS',
  tokenDecimals: 18,
  nativeTokenDropAmount: '1000000000000000000',
  amount: 1000000,
  publicKey: wallet.publicKey,
  privateKey: wallet.privateKey
  simulate: false
});

// Get jetton balance
const balance = await aaService.getJettonBalance(
  'JETTON_MASTER_ADDRESS',
  'WALLET_ADDRESS'
);
```

## API

### WDKAccountAbstractionTON

The main class that provides account abstraction functionality for TON blockchain.

#### Constructor

```javascript
constructor(config)
```

#### Methods

- `initializeWallet(keyPair)` - Initialize a wallet from a key pair
- `createTransfer(opts)` - Create a transfer transaction
- `send(opts)` - Send a gasless transaction
- `quoteSend(opts)` - Quote a send operation
- `bridge(opts)` - Bridge tokens to other chains
- `quoteBridge(opts)` - Quote a bridge operation
- `getJettonBalance(jettonAddress, walletAddress)` - Get the balance of a jetton wallet
- `getJettonWalletAddress(keyPair, jettonAddress)` - Get the jetton wallet address

## License

MIT
