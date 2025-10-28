// Core integration tests: registration, routing, basic sanity
import dotenv from 'dotenv';
dotenv.config();

import Core from '@tetherto/wdk-core';
import BtcModule from '@tetherto/wdk-wallet-btc';
import EvmModule from '@tetherto/wdk-wallet-evm';
import WDK from '@tetherto/wdk-core';

describe('WDK Core - Integration (core module)', () => {
  let core;

  beforeAll(() => {
    const core = new Core(process.env.SEED_PHRASE.trim());
    console.log('Core instance:', core);
  });

  afterAll(async () => {
    if (core && core.shutdown) {
      await core.shutdown();
    }
  });

  test('registers BTC and EVM modules successfully', async () => {
    const btc = new BtcModule({ network: 'testnet' });
    const evm = new EvmModule({
      network: 'sepolia',
      rpcUrl: process.env.SEPOLIA_RPC_URL
    });

    const btcId = core.registerModule('btc', btc);
    const evmId = core.registerModule('evm', evm);

    expect(btcId).toBeDefined();
    expect(evmId).toBeDefined();

    // duplicate registration should throw
    expect(() => core.registerModule('btc', btc)).toThrow();
  });

  test('dispatches to correct module for chain id / network', async () => {
    const managerBtc = core.resolveManager('btc:testnet');
    const managerEvm = core.resolveManager('evm:sepolia');

    expect(managerBtc).toBeDefined();
    expect(managerEvm).toBeDefined();
    expect(managerBtc.chain).toMatch(/btc/i);
    expect(managerEvm.chain).toMatch(/evm|ethereum/i);
  });

  test('rejects unknown module registration gracefully', () => {
    expect(() => core.registerModule('unknown', {})).toThrow();
  });
});
