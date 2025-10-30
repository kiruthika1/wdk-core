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
  if (!process.env.SEED_PHRASE) {
        console.warn('⚠️ SEED_PHRASE not set. Skipping core integration tests.');
        return;
      }

    core = new Core(process.env.SEED_PHRASE.trim());

  });

  afterAll(async () => {
    if (core && core.shutdown) {
      await core.shutdown();
    }
  });

  test('initializes WDK core with valid seed phrase', () => {
      expect(core).toBeDefined();
      expect(core._seed).toMatch(/\b[a-z]+\b/);
    });

  test('registers BTC and EVM modules successfully', async () => {

   if (!process.env.SEPOLIA_RPC_URL) {
        console.warn('⚠️ SEPOLIA_RPC_URL not set. Skipping EVM registration test.');
        return;
      }

    const btc = new BtcModule({ network: 'testnet' });
    const evm = new EvmModule({
      network: 'sepolia',
      rpcUrl: process.env.SEPOLIA_RPC_URL
    });

core
  .registerWallet('btc', BtcModule, { network: 'testnet' })
  .registerWallet('evm', EvmModule, { network: 'sepolia', rpcUrl: process.env.SEPOLIA_RPC_URL });

const btcWallet = core._wallets.get('btc');
const evmWallet = core._wallets.get('evm');


expect(btcWallet).toBeDefined();
expect(evmWallet).toBeDefined();
expect(btcWallet).toBeInstanceOf(BtcModule);
expect(evmWallet).toBeInstanceOf(EvmModule);
  });

  test('handles duplicate wallet registration gracefully', () => {
    core.registerWallet('btc', BtcModule, { network: 'testnet' });
    expect(() => core.registerWallet('btc', BtcModule, { network: 'testnet' })).not.toThrow();
  });

  test('dispatches to correct module for chain id / network using mocks', async () => {

  class MockBtcWallet {
    constructor(seed, config) {
      this.chain = 'btc';
      this.seed = seed;
      this.config = config;
    }
  }

  class MockEvmWallet {
    constructor(seed, config) {
      this.chain = 'evm';
      this.seed = seed;
      this.config = config;
    }
  }

    core
      .registerWallet('btc', MockBtcWallet, { network: 'testnet' })
      .registerWallet('evm', MockEvmWallet, { network: 'sepolia', rpcUrl: process.env.SEPOLIA_RPC_URL });

const btcWallet = core._wallets.get('btc');
const evmWallet = core._wallets.get('evm');

    expect(btcWallet).toBeDefined();
    expect(evmWallet).toBeDefined();
    expect(btcWallet.chain).toMatch(/btc/i);
    expect(evmWallet.chain).toMatch(/evm|ethereum/i);
  });

  test('rejects unknown module registration gracefully', () => {
    expect(() => core.registerModule('unknown', {})).toThrow();
  });
});
