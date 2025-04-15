<p align="center">
  <a href="https://layerzero.network">
    <img alt="LayerZero" style="max-width: 500px" src="https://d3a2dpnnrypp5h.cloudfront.net/bridge-app/lz.png"/>
  </a>
</p>

<h1 align="center">@wdk-account-abstraction-ton/ui-core</h1>

<!-- The badges section -->
<p align="center">
  <!-- Shields.io NPM published package version -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-core"><img alt="NPM Version" src="https://img.shields.io/npm/v/@wdk-account-abstraction-ton/ui-core"/></a>
  <!-- Shields.io NPM downloads -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-core"><img alt="Downloads" src="https://img.shields.io/npm/dm/@wdk-account-abstraction-ton/ui-core"/></a>
  <!-- Shields.io vulnerabilities -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-core"><img alt="Snyk Vulnerabilities for npm package version" src="https://img.shields.io/snyk/vulnerabilities/npm/@wdk-account-abstraction-ton/ui-core"/></a>
  <!-- Shields.io license badge -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-core"><img alt="NPM License" src="https://img.shields.io/npm/l/@wdk-account-abstraction-ton/ui-core"/></a>
</p>

## Installation

```bash
yarn add @wdk-account-abstraction-ton/ui-core

pnpm add @wdk-account-abstraction-ton/ui-core

npm install @wdk-account-abstraction-ton/ui-core
```

## Overview

This package contains the core primitives required to build a dApp:

- [Networks](#networks)
- [Tokens and Coins](#tokens-and-coins)
- [Fractions](#amounts)
- [Amounts](#amounts)
- [Transaction](#transaction)
- [Configurable runtime](#runtime)
- [LayerZero primitives](#layerzero-primitives)

Note that in `ui-core` we only expose chain agnostic primitives and this package is supplemented with [ui-evm](../ui-evm/) or [ui-aptos](../ui-aptos/) packages that contain implementation for specific chain types.

## Usage

### Networks

```typescript
import {
  getNetwork,
  tryGetNetwork,
  getNetworkByNativeChainId,
  tryGetNetworkByNativeChainId,
} from '@wdk-account-abstraction-ton/ui-core';

const ethereum = getNetwork('ethereum'); // throws if not defined
const aptos = tryGetNetwork('aptos'); // returns undefined if not defined

console.log(
  `Ethereum native currency is ${ethereum.nativeCurrency.symbol} with ${ethereum.nativeCurrency.decimals} decimals`,
);

// you can also try to find network by native chain id
const avalanche = getNetworkByNativeChainId('evm', 43114); // throws if not defined
const osmosis = tryGetNetworkByNativeChainId('cosmos', 'osmosis'); // returns undefined if not defined
```

### Tokens and Coins

We define the `Currency` type as either a `Token` or a `Coin`, both of which provide a public equality function. `Coin` is a native currency that will not have an address, while `Token` represents an ERC20 with a unique address.

```typescript
import {Token, Coin, getNativeCurrency} from '@wdk-account-abstraction-ton/ui-core';

const token = Token.from({
  chainKey: 'ethereum',
  decimals: 18,
  address: '0x...',
  symbol: 'SYMBOL',
});

const eth = getNativeCurrency('ethereum'); // return ETH Coin
const bnb = getNativeCurrency('bsc'); // returns BNB Coin
const aptos = getNativeCurrency('aptos'); // return Aptos Token

// comparison
eth.equals(bnb); // false
eth.equals(token); // false
eth.equals(Coin.from({chainKey: 'ethereum', decimals: 18, symbol: 'ETH'})); // true
```

### Amounts

The `CurrencyAmount` class should be used to manage any amounts in your dApp. The decimal scale varies across currencies, and mathematical operations and formatting should be treated carefully. This class extends `Fraction` which simplifies BigInt arithmetic, and provides a few formatting functions for various use cases.

```typescript
import {parseCurrencyAmount, tryParseCurrencyAmount, CurrencyAmount} from '@wdk-account-abstraction-ton/ui-core';

// parsing
const ethAmount = parseCurrencyAmount(eth, '1'); // throws if invalid input provided
const bnbAmount = CurrencyAmount.fromBigInt(bnb, BigInt(1e18));
const aptosAmount = tryParseCurrencyAmount(aptos, '1.00000000001'); // returns undefined because invalid number of decimals

// math
ethAmount.add(ethAmount);
ethAmount.subtract(ethAmount);
ethAmount.divide(1);
ethAmount.multiply(3);
ethAmount.equals(bnbAmount); // throws - can't compare different tokens
ethAmount.lessThan(ethAmount);
ethAmount.greaterThan(ethAmount);

// formatting
bnbAmount.toFixed(2);
bnbAmount.toSignificant(2);
bnbAmount.toExact();
```

### Transaction

Intro tx and more explicit example or additional comments explaining what each step should be used for

```typescript

import {Transaction} from '@wdk-account-abstraction-ton/ui-core';

// Transaction<Signer> is an interface that has to be implemented by specific app

const unsignedTransaction = await app.performAction({...});

const transactionRequest = await unsignedTransaction.signAndSubmit(signer);

const transactionReceipt = await transactionRequest.wait()

console.log(`Transaction hash is ${transactionReceipt.txHash}`);

```

### LayerZero primitives

Intro the primitives and add example for Deployment

```typescript
import {AdapterParams, FeeQuote, Deployment} from '@wdk-account-abstraction-ton/ui-core';

// sending message cross chain usually involves quoting message fee
// message fee depends on adapterParams

// if not dstNativeAmount
const extraGas = 200_000;
const adapterParamsV1 = AdapterParams.forV1(extraGas);

// const if sending dstNativeAmount
const dstNativeAmount = CurrencyAmount.fromBigInt(eth, BigInt(10_000_000));
const dstNativeAddress = '0x.....';

// send dst native amount
const adapterParamsV2 = AdapterParams.forV2({
  extraGas,
  dstNativeAmount,
  dstNativeAddress,
});

const messageFee: FeeQuote = await app.quoteMessageFee({...input, adapterParams});
```

### Runtime

Explain that this is the preferred way to use the core concepts from above and why

```typescript
import {coreModule} from '@wdk-account-abstraction-ton/ui-core';

// list of configured networks
const networks = coreModule.getNetworks();

// list of configured layer zero deployments
const deployments = coreModule.getDeployments();

// list of configured RPCs for chain
const rpcs = coreModule.getRpcs('ethreum');
```

### Configuration

```typescript


// adding not supported network
coreModule.setNetworks([
  {
    chainKey: "hardhat",
    chainType: "evm",
    nativeChainId: 1;
    name: "Hardhat";
    shortName: "Hardhat";
    nativeCurrency: {
        name: "ETH";
        symbol: "ETH";
        decimals: 18;
    }
  }
]);

const hardhat = getNetwork("hardhat")

```

## Design

The aim of this package is to provide a pattern for building chain agnostic dApps. For this reason we have to introduce some minimal abstractions that allow us to separate application business logic from specific blockchain implementation.

We **do not want** to replace integration libraries like `ethers`, `viem`, `aptos` or `@solana/web3.js` which are still needed.

Lets create an example ping-pong app.

The first step is to define the business logic of your app (**Application Api Interface**) in form of an interface that will be implemented for each specific blockchain type required by the application. Our app will allow sending a `ping` message to a remote chain. We also want the fee for sending the message to be paid by the sender.

**Application Api Implementation** is usually a facade or mediator - most often frontend apps don't need to know that they interact with specific contracts.
Application Api hides the implementation details of a protocol exposing only the core business logic via the interface it implements.
If you are familiar with [CQRS](https://martinfowler.com/bliki/CQRS.html), identify Commands and Queries your app needs to implement to fulfill its requirements. In our case we have one command `ping` and one query `getMessageFee` (user needs to know what will be the fee before sending the message).

```typescript
import {ChainKey, Transaction, FeeQuote} from '@wdk-account-abstraction-ton/ui-core';

// our interface to implement
interface PingPongApi<Signer> {
  ping(input: PingInput): Promise<Transaction<Signer>>;
  getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote>;

  // often apps need know if api supports specific input - this is useful if your app supports different chain types
  supports(input: SupportsInput): boolean;
}

interface PingInput {
  srcChainKey: ChainKey;
  dstChainKey: ChainKey;
  adapterParams: AdapterParams;
  fee: FeeQuote;
}

interface GetMessageFeeInput {
  srcChainKey: ChainKey;
  dstChainKey: ChainKey;
  adapterParams: AdapterParams;
}

interface SupportsInput {
  srcChainKey: ChainKey;
}
```

Our app also needs to know the details of the contracts it has been deployed to and is going to interact with. We call this the Application Configuration.

```typescript
// describe your dapp configuration
interface PingPongConfig {
  // your dapp needs to be deployed on specific chain
  deployments: {
    [chainKey in ChainKey]?: {
      eid: number; // you need to provide explicit endpoint id your dapp is deployed to
      ping: {
        address: string;
      };
    };
  };
}
```

Now lets define chain specific implementation. We will pick EVM with [ethers](https://www.npmjs.com/package/ethers) with [typechain](https://www.npmjs.com/package/typechain) but note that our goal is not to enforce any specific library like
[ethers](https://www.npmjs.com/package/ethers) or [viem](https://www.npmjs.com/package/viem).

```typescript
import {BaseProvider} from '@ethersproject/providers';
import {
  serializeAdapterParams,
  createTransaction,
  type ProviderFactory,
} from '@wdk-account-abstraction-ton/ui-evm';

class PingPongApi__evm<Signer> implements PingPongApi<Signer> {
  constructor(
    protected readonly config: PingPongConfig,
    protected getProvider: ProviderFactory,
  ) {}

  public supports(input: SupportsInput): boolean {
    return this.tryGetDeployment(input.srcChainKey) !== undefined;
  }

  public async ping(input: PingInput): Promise<Transaction<Signer>> {
    const pingContract = this.getPingContract(input.srcChainKey);
    const dstEid = this.chainKeyToEndpointId(input.dstChainKey);
    const populatedTransaction = await pingContract.populateTransaction.quoteMessageFee(
      dstEid,
      serializeAdapterParams(input.adapterParams),
      input.fee.nativeFee.toBigInt(),
    );
    // util that simplifies creating transaction from populated transaction
    return createTransaction(populatedTransaction);
  }

  public async getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote> {
    const pingContract = this.getPingContract(input.srcChainKey);
    const dstEid = this.chainKeyToEndpointId(input.dstChainKey);

    const quote = pingContract.quoteMessageFee(dstEid, serializeAdapterParams(input.adapterParams));

    const srcNative = getNativeCurrency(input.srcChainKey);

    const fee: FeeQuote = {
      nativeFee: CurrencyAmount.fromBigInt(srcNative, quote.nativeFee.toBigInt()),
      zroFee: CurrencyAmount.fromBigInt(srcNative, 0),
    };
    return fee;
  }

  // non public methods
  protected getPingContract(chainKey: ChainKey) {
    const provider = this.getProvider(chainKey);
    const deployment = this.getDeployment(chainKey);
    // returning contract instance from typechain factory
    return PingPong__factory.connect(deployment.ping.address, provider);
  }

  // your app is responsible for mapping chain key to endpoint id
  protected chainKeyToEndpointId(chainKey) {
    return this.getDeployment(chainKey).eid;
  }

  protected getDeployment(chainKey: ChainKey) {
    const deployment = this.tryGetDeployment(chainKey);
    if (deployment) return deployment;
    throw new Error(`No deployment for ${chainKey}`);
  }

  protected tryGetDeployment(chainKey: ChainKey) {
    return this.config.deployments[chainKey];
  }
}
```

Now it's time to use our app

```typescript
import {createFailoverProviderFactory} from '@wdk-account-abstraction-ton/ui-evm';
import {Wallet} from 'ethers';

const config: PingPongConfig = {
  deployments: {
    goerli: {
      eid: 10121,
      ping: {
        address: '0x....',
      },
    },
    'bsc-testnet': {
      eid: 10102,
      ping: {
        address: '0x....',
      },
    },
  },
};

// creating API for EVM
const providerFactory = createFailoverProviderFactory(); // no arguments passed, using public rpc list

const api = new PingPongApi__evm(config, providerFactory);

async function sendPing<Signer>(
  api: PingPongApi<Signer>,
  srcChainKey: ChainKey,
  dstChainKey: ChainKey,
  signer: Signer,
) {
  const adapterParams = AdapterParams.forV1(0);
  const messageFee = await api.getMessageFee({srcChainKey, dstChainKey, adapterParams});
  // sending transaction
  const unsignedTransaction = await api.ping({
    srcChainKey,
    dstChainKey,
    fee: messageFee,
    adapterParams,
  });

  const transactionRequest = await unsignedTransaction.singAndSubmit(wallet);

  const transactionReceipt = await transactionRequest.wait();
  return await waitForMessageReceived({txHash: transactionReceipt.txHash});
}

const srcChainKey = 'goerli';
const dstChainKey = 'bsc-tesnet';
const wallet = Wallet.fromMnemonic('seed phrase').connect(providerFactory(srcChainKey));

sendPing(api, srcChainKey, dstChainKey, wallet).then(() => console.log('Ping received'));
```

Note that we can now provide implementation for `aptos` but our sendPing function will remain the same.
