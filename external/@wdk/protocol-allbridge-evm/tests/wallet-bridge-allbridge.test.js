// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

const { test } = require('brittle')
const opts = require('./test.opts.json')
const BridgeAllbridge = require('../src/bridge')

test('Create an instance of BridgeAllbridge and quote swap from Ethereum to Solana', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await bridge.getTransactionCost('solana')
  const stablecoinFee = await bridge.getBridgingCostInTokens('solana')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'solana',
    '9aoGiwCs3wJUQFH8P2DKZmtDZwoJb4LxEm1YxtAc42yd', // Solana address
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Ethereum to Arbitrum', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await bridge.getTransactionCost('arbitrum')
  const stablecoinFee = await bridge.getBridgingCostInTokens('arbitrum')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'arbitrum',
    '0x389938CF14Be379217570D8e4619E51fBDafaa21',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Ethereum to Polygon', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await bridge.getTransactionCost('polygon')
  const stablecoinFee = await bridge.getBridgingCostInTokens('polygon')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'polygon',
    '0x6D85a8Ffbff0c46C9DeA4560410Ab4D31371b5D6',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Arbitrum to Ethereum', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await bridge.getTransactionCost('ethereum')
  const stablecoinFee = await bridge.getBridgingCostInTokens('ethereum')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'ethereum',
    '0x40c904D4a3A6CfECcD03F74fd4037E486394198d',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Arbitrum to Solana', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await bridge.getTransactionCost('solana')
  const stablecoinFee = await bridge.getBridgingCostInTokens('solana')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'solana',
    '9aoGiwCs3wJUQFH8P2DKZmtDZwoJb4LxEm1YxtAc42yd',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Arbitrum to Polygon', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await bridge.getTransactionCost('polygon')
  const stablecoinFee = await bridge.getBridgingCostInTokens('polygon')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'polygon',
    '0x6D85a8Ffbff0c46C9DeA4560410Ab4D31371b5D6',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Polygon to Ethereum', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'polygon',
    providerUrl: opts.polygonRPC
  })

  const nativeFee = await bridge.getTransactionCost('ethereum')
  const stablecoinFee = await bridge.getBridgingCostInTokens('ethereum')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' POL')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'ethereum',
    '0x40c904D4a3A6CfECcD03F74fd4037E486394198d',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Polygon to Solana', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'polygon',
    providerUrl: opts.polygonRPC
  })

  const nativeFee = await bridge.getTransactionCost('solana')
  const stablecoinFee = await bridge.getBridgingCostInTokens('solana')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' POL')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'solana',
    '9aoGiwCs3wJUQFH8P2DKZmtDZwoJb4LxEm1YxtAc42yd',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and quote swap from Polygon to Arbitrum', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'polygon',
    providerUrl: opts.polygonRPC
  })

  const nativeFee = await bridge.getTransactionCost('arbitrum')
  const stablecoinFee = await bridge.getBridgingCostInTokens('arbitrum')

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' POL')
  t.ok(typeof (stablecoinFee) === 'bigint', 'Stablecoin fee is ' + (Number(stablecoinFee) / 10 ** 6) + ' USDT')

  await bridge.swapAndBridge(
    'arbitrum',
    '0x389938CF14Be379217570D8e4619E51fBDafaa21',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and claim on Ethereum', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'ethereum',
    providerUrl: opts.polygonRPC
  })

  await bridge.receiveTokens(
    100000000,
    '0x40c904D4a3A6CfECcD03F74fd4037E486394198d',
    'solana',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and claim on Arbitrum', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  await bridge.receiveTokens(
    100000000,
    '0x389938CF14Be379217570D8e4619E51fBDafaa21',
    'solana',
    100000000
  )
})

test('Create an instance of BridgeAllbridge and claim on Polygon', async function (t) {
  const bridge = new BridgeAllbridge({
    chain: 'polygon',
    providerUrl: opts.polygonRPC
  })

  await bridge.receiveTokens(
    100000000,
    '0x6D85a8Ffbff0c46C9DeA4560410Ab4D31371b5D6',
    'solana',
    100000000
  )
})
