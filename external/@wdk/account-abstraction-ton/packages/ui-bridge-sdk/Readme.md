<p align="center">
  <a href="https://layerzero.network">
    <img alt="LayerZero" style="max-width: 500px" src="https://d3a2dpnnrypp5h.cloudfront.net/bridge-app/lz.png"/>
  </a>
</p>

<h1 align="center">@wdk-account-abstraction-ton/ui-bridge-sdk</h1>

<!-- The badges section -->
<p align="center">
  <!-- Shields.io NPM published package version -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-bridge-sdk"><img alt="NPM Version" src="https://img.shields.io/npm/v/@wdk-account-abstraction-ton/ui-bridge-sdk"/></a>
  <!-- Shields.io NPM downloads -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-bridge-sdk"><img alt="Downloads" src="https://img.shields.io/npm/dm/@wdk-account-abstraction-ton/ui-bridge-sdk"/></a>
  <!-- Shields.io vulnerabilities -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-bridge-sdk"><img alt="Snyk Vulnerabilities for npm package version" src="https://img.shields.io/snyk/vulnerabilities/npm/@wdk-account-abstraction-ton/ui-bridge-sdk"/></a>
  <!-- Shields.io license badge -->
  <a href="https://www.npmjs.com/package/@wdk-account-abstraction-ton/ui-bridge-sdk"><img alt="NPM License" src="https://img.shields.io/npm/l/@wdk-account-abstraction-ton/ui-bridge-sdk"/></a>
</p>

## Installation

```bash
yarn add @wdk-account-abstraction-ton/ui-bridge-sdk

pnpm add @wdk-account-abstraction-ton/ui-bridge-sdk

npm install @wdk-account-abstraction-ton/ui-bridge-sdk
```

## Usage

```typescript
import BridgeApi from '@wdk-account-abstraction-ton/ui-bridge-sdk';
import {
  AdapterParams,
  CurrencyAmount,
  getNativeCurrency,
  parseCurrencyAmount,
} from '@wdk-account-abstraction-ton/ui-core';
import {waitForMessageReceived} from '@layerzerolabs/scan-client';

async function test() {
  // evm
  const srcBridge: BridgeApi<any, {eqReward: CurrencyAmount}> = null!;
  // aptos
  const dstBridge: BridgeApi<any, {eqReward: CurrencyAmount}> = null!;

  const srcWallet = {address: '0x', signer: {}};
  const dstWallet = {address: '0x', signer: {}};

  const srcChainId = ChainId.ETHEREUM;
  const dstChainId = ChainId.APTOS;

  const srcCurrency = getNativeCurrency(srcChainId);
  const dstCurrency = getNativeCurrency(dstChainId);

  const srcNative = getNativeCurrency(srcChainId);
  const dstNative = getNativeCurrency(dstChainId);

  const amount = parseCurrencyAmount(srcCurrency, '10');
  const output = await srcBridge.getOutput(amount, dstCurrency);
  const minAmount = output.amount;

  if (!(await srcBridge.isApproved(amount, srcWallet.address))) {
    const tx = await srcBridge.approve(amount);
    const result = await tx.signAndSubmitTransaction(srcWallet.signer);
  }

  // todo: add getBalance to srcBridge
  const dstNative = await dstBridge.getBalance(dstCurrency, '10');

  const registerCost = await (
    await srcBridge.register(dstCurrency)
  ).estimateNative(dstWallet.signer);

  if (!(await dstBridge.isRegistered(dstCurrency, srcWallet.address))) {
    if (dstNative.greaterThan(registerCost)) {
      const tx = await dstBridge.register(dstCurrency);
      const result = await tx.signAndSubmitTransaction(srcWallet.signer);
    }
  }

  const extraGas = await srcBridge.getExtraGas(srcChainId, dstChainId);

  const adapterParams = AdapterParams.forV2({
    extraGas,
    dstNativeAddress: dstWallet.address,
    dstNativeAmount: parseCurrencyAmount(dstNative, '10'),
  });

  const fee = await srcBridge.getMessageFee(srcChainId, dstChainId, adapterParams);

  const swap = await srcBridge.transfer({
    amount,
    minAmount,
    srcCurrency,
    dstCurrency,
    adapterParams,
    fee,
    dstAddress: dstWallet.address,
    srcAddress: srcWallet.address,
    dstChainId,
    srcChainId,
  });

  const result = await swap.signAndSubmitTransaction(srcWallet.signer);

  const receipt = await result.wait();
  const message = await waitForMessageReceived(srcChainId, receipt.txHash);

  console.log('Dst txHash', message.dstTxHash);
}
```
