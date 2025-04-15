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
const LendingAave = require('../src/aave')

test('Test supply, borrow and repay', async function (t) {
  const lendingAave = new LendingAave({
    chain: 'ethereum',
    providerUrl: opts.ethereumRPC
  })

  console.log('User account data:', await lendingAave.getUserAccountData('0x372Eca68346A92C03a0D7EDc5f7E6A5A6384106F'))

  t.ok(await lendingAave.supply(100000, '0x372Eca68346A92C03a0D7EDc5f7E6A5A6384106F'), 'Supply')

  t.ok(await lendingAave.setUserUseReserveAsCollateral(false), 'Set User Use Reserve As Collateral')

  t.ok(await lendingAave.borrow(100000, '0x372Eca68346A92C03a0D7EDc5f7E6A5A6384106F'), 'Borrow')

  t.ok(await lendingAave.repay(100000, '0x372Eca68346A92C03a0D7EDc5f7E6A5A6384106F'), 'Repay')

  t.ok(await lendingAave.withdraw(100000, '0x372Eca68346A92C03a0D7EDc5f7E6A5A6384106F'), 'Withdraw')
})
