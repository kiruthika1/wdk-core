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
// USDT0 Bridge
const { 
  BridgeUSDT0, 
  BridgeHelperUSDT0
} = require('@wdk/protocol-usdt0-evm');

// Stargate Bridge
const { 
  BridgeStargate
} = require('@wdk/protocol-stargate-evm');

// Allbridge
const { 
  BridgeAllbridge
} = require('@wdk/protocol-allbridge-evm');

const CHAIN_INTERFACE_MAP = [
  { chain1: 'ethereum', chain2: 'arbitrum', interface: BridgeUSDT0 },
  { chain1: 'ethereum', chain2: 'tron', interface: BridgeUSDT0 },
  { chain1: 'ethereum', chain2: 'ton', interface: BridgeUSDT0 },
  { chain1: 'ethereum', chain2: 'polygon', interface: BridgeStargate },
  { chain1: 'ethereum', chain2: 'avalanche', interface: BridgeStargate },
  { chain1: 'ethereum', chain2: 'solana', interface: BridgeAllbridge },
  { chain1: 'arbitrum', chain2: 'ethereum', interface: BridgeHelperUSDT0 },
  { chain1: 'arbitrum', chain2: 'tron', interface: BridgeHelperUSDT0 },
  { chain1: 'arbitrum', chain2: 'ton', interface: BridgeHelperUSDT0 },
  { chain1: 'arbitrum', chain2: 'polygon', interface: BridgeStargate },
  { chain1: 'arbitrum', chain2: 'avalanche', interface: BridgeStargate },
  { chain1: 'arbitrum', chain2: 'solana', interface: BridgeAllbridge },
  { chain1: 'polygon', chain2: 'avalanche', interface: BridgeStargate },
  { chain1: 'polygon', chain2: 'ethereum', interface: BridgeStargate },
  { chain1: 'polygon', chain2: 'arbitrum', interface: BridgeStargate },
  { chain1: 'polygon', chain2: 'solana', interface: BridgeAllbridge },
  { chain1: 'avalanche', chain2: 'ethereum', interface: BridgeStargate },
  { chain1: 'avalanche', chain2: 'arbitrum', interface: BridgeStargate },
  { chain1: 'avalanche', chain2: 'polygon', interface: BridgeStargate }
]

module.exports = CHAIN_INTERFACE_MAP