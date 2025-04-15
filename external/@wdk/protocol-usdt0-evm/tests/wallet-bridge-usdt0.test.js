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
const Bridge = require('../src/bridge')
const BridgeHelper = require('../src/bridge-helper')
const BridgeTron = require('../src/bridge-tron')

test('Create an instances of Bridge and quote swap from Ethereum to Arbitrum (ACCEPTABLE < 2 USDT)', async function (t) {
  const walletBridge = new Bridge({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'arbitrum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'arbitrum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

test('Create an instances of Bridge and quote swap from Ethereum to Tron (EXPENSIVE > 20 USDT)', async function (t) {
  const walletBridge = new Bridge({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'tron',
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'tron',
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

test('Create an instances of Bridge and quote swap from Ethereum to TON (ACCEPTABLE < 2 USDT)', async function (t) {
  const walletBridge = new Bridge({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

test('Create an instances of Bridge and quote swap from Arbitrum to Ethereum (ACCEPTABLE < 2 USDT)', async function (t) {
  const walletBridge = new Bridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'ethereum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'ethereum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

test('Create an instances of Bridge and quote swap from Arbitrum to Tron (EXPENSIVE > 20 USDT)', async function (t) {
  const walletBridge = new Bridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'tron',
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'tron',
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

test('Create an instances of Bridge and quote swap from Arbitrum to Ton (ACCEPTABLE < 2 USDT)', async function (t) {
  const walletBridge = new Bridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

test('Create an instances of Bridge and quote swap from Arbitrum to Ton and airdrop TRX', async function (t) {
  const walletBridge = new Bridge({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  const txData = await walletBridge.send(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
    '1000000'
  )
})

test('Create an instances of BridgeTron and quote swap from Tron to Arbitrum', async function (t) {
  const walletBridge = new BridgeTron({
    chain: 'tron',
    providerUrl: opts.tronRPC,
    tronGridApiKey: opts.tronGridApiKey
  })

  const nativeFee = await walletBridge.quoteSend(
    'arbitrum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'string', 'Native fee is ' + (Number(nativeFee) / 10 ** 6) + ' TRX')

  const txData = await walletBridge.send(
    'arbitrum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000',
    nativeFee,
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000'
  )
})

test('Create an instances of BridgeTron and quote swap from Tron to Ton', async function (t) {
  const walletBridge = new BridgeTron({
    chain: 'tron',
    providerUrl: opts.tronRPC,
    tronGridApiKey: opts.tronGridApiKey
  })

  const nativeFee = await walletBridge.quoteSend(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'string', 'Native fee is ' + (Number(nativeFee) / 10 ** 6) + ' TRX')

  const txData = await walletBridge.send(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000',
    nativeFee,
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000'
  )
})

test('Create an instances of BridgeTron and quote swap from Tron to Ethereum', async function (t) {
  const walletBridge = new BridgeTron({
    chain: 'tron',
    providerUrl: opts.tronRPC,
    tronGridApiKey: opts.tronGridApiKey
  })

  const nativeFee = await walletBridge.quoteSend(
    'ethereum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000'
  )

  t.ok(typeof (nativeFee) === 'string', 'Native fee is ' + (Number(nativeFee) / 10 ** 6) + ' TRX')

  const txData = await walletBridge.send(
    'ethereum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000',
    nativeFee,
    'TYrb3SqkLfqXHurTagF83FDomXF2snBTpo',
    '1000000'
  )
})

test('Create an instances of BridgeHelper and quote swap from Arbitrum to Ethereum (ACCEPTABLE < 2 USDT)', async function (t) {
  const walletBridge = new BridgeHelper({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const fees = await walletBridge.quoteSend(
    'ethereum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000'
  )

  t.ok(typeof (fees['nativeFee']) === 'bigint', 'Native fee is ' + (Number(fees['nativeFee']) / 10 ** 18) + ' ETH')
  t.ok(typeof (fees['feeQuoteInTokens']) === 'bigint', 'Tokens denominated fee is ' + (Number(fees['feeQuoteInTokens']) / 10 ** 6) + ' USDT')

  const txData = await walletBridge.send(
    'ethereum',
    '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03',
    '1000000',
    fees['nativeFee']
  )
})

test('Create an instances of BridgeHelper and quote swap from Arbitrum to Ton (ACCEPTABLE < 2 USDT)', async function (t) {
  const walletBridge = new BridgeHelper({
    chain: 'arbitrum',
    providerUrl: opts.arbitrumRPC
  })

  const fees = await walletBridge.quoteSend(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000'
  )

  t.ok(typeof (fees['nativeFee']) === 'bigint', 'Native fee is ' + (Number(fees['nativeFee']) / 10 ** 18) + ' ETH')
  t.ok(typeof (fees['feeQuoteInTokens']) === 'bigint', 'Tokens denominated fee is ' + (Number(fees['feeQuoteInTokens']) / 10 ** 6) + ' USDT')

  const txData = await walletBridge.send(
    'ton',
    'UQAqxtYFXRbVRjo1GQbGVtJCoifxIRPWeiCa_rTf93uxuBtz',
    '1000000',
    fees['nativeFee']
  )
})
