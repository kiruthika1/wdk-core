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
const WalletBridgeStargatePoolUSDT = require('../src/bridge')

/**
 * Test suite for WalletBridgeStargatePoolUSDT cross-chain transfers
 * Tests various scenarios for sending USDT between different chains
 * using the Stargate protocol
 */

/**
 * Tests USDT transfer from Ethereum to Avalanche
 * Verifies fee estimation and transaction preparation
 */
test('Quote swap and send from Ethereum to Avalanche', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  // Test amount: 1 USDT (6 decimals)
  const testAmount = '1000000'
  const testAddress = '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db'
  const refundAddress = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'

  const nativeFee = await walletBridge.quoteSend(
    'avalanche',
    testAddress,
    testAmount
  )

  t.ok(typeof nativeFee === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  await walletBridge.send(
    'avalanche',
    testAddress,
    testAmount,
    nativeFee,
    refundAddress
  )
})

/**
 * Tests USDT transfer from Ethereum to Polygon
 * Verifies fee estimation and transaction preparation
 */
test('Quote swap and send from Ethereum to Polygon', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'polygon',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000'
  )

  t.ok(typeof nativeFee === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  await walletBridge.send(
    'polygon',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

/**
 * Tests USDT transfer from Avalanche to Ethereum
 * Verifies fee estimation and transaction preparation
 */
test('Quote swap and send from Avalanche to Ethereum', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'avalanche',
    providerUrl: opts.avalancheRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'ethereum',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000'
  )

  t.ok(typeof nativeFee === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' AVAX')

  await walletBridge.send(
    'ethereum',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

/**
 * Tests USDT transfer from Avalanche to Polygon
 * Verifies fee estimation and transaction preparation
 */
test('Quote swap and send from Avalanche to Polygon', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'avalanche',
    providerUrl: opts.avalancheRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'polygon',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000'
  )

  t.ok(typeof nativeFee === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' AVAX')

  await walletBridge.send(
    'polygon',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

/**
 * Tests USDT transfer from Polygon to Ethereum
 * Verifies fee estimation and transaction preparation
 */
test('Quote swap and send from Polygon to Ethereum', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'polygon',
    providerUrl: opts.polygonRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'ethereum',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000'
  )

  t.ok(typeof nativeFee === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' MATIC')

  await walletBridge.send(
    'ethereum',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

/**
 * Tests USDT transfer from Polygon to Avalanche
 * Verifies fee estimation and transaction preparation
 */
test('Quote swap and send from Polygon to Avalanche', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'polygon',
    providerUrl: opts.polygonRPC
  })

  const nativeFee = await walletBridge.quoteSend(
    'avalanche',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000'
  )

  t.ok(typeof nativeFee === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' MATIC')

  await walletBridge.send(
    'avalanche',
    '0x96096F91520CAA0FbB83b66Cc040e7F500B012Db',
    '1000000',
    nativeFee,
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  )
})

/**
 * Tests USDT transfer with native token airdrop
 * Verifies fee estimation and transaction preparation with native token drop
 * on the destination chain
 */
test('Create an instance of WalletBridgeStargatePoolUSDT and quote swap from Avalanche to Polygon and airdrop TRX', async function (t) {
  const walletBridge = new WalletBridgeStargatePoolUSDT({
    chain: 'avalanche',
    providerUrl: opts.avalancheRPC
  })

  // Test amount: 1 USDT (6 decimals)
  const testAmount = '1000000'
  const testAddress = '0x1C2DA3BE47dc4Dc22949CEF903682541f544ab03'
  const refundAddress = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'
  // Native token drop amount: 1 AVAX (18 decimals)
  const nativeDropAmount = '1000000'

  const nativeFee = await walletBridge.quoteSend(
    'polygon',
    testAddress,
    testAmount,
    nativeDropAmount
  )

  t.ok(typeof (nativeFee) === 'bigint', 'Native fee is ' + (Number(nativeFee) / 10 ** 18) + ' ETH')

  await walletBridge.send(
    'polygon',
    testAddress,
    testAmount,
    nativeFee,
    refundAddress,
    nativeDropAmount
  )
})
