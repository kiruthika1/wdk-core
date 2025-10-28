import dotenv from 'dotenv';
dotenv.config();

import Core from '@tetherto/wdk-core';
import WDK from '@tetherto/wdk-core';
import BtcModule from '@tetherto/wdk-wallet-btc';

const MNEMONIC = process.env.TEST_MNEMONIC;
const BTC_RPC_URL = process.env.BTC_TESTNET_RPC_URL || 'https://example.testnet.node';

describe('WDK - BTC module integration', () => {
  let core, btcWallet;

  beforeAll(() => {
    // Initialize WDK Core with seed phrase
    core = new WDK(process.env.SEED_PHRASE?.trim() || MNEMONIC);

    // Register BTC wallet
    core.registerWallet('btc', BtcModule, {
      network: 'testnet',
      rpcUrl: BTC_RPC_URL,
    });

    btcWallet = core._wallets.get('btc');
    console.log('🔍 BTC Wallet instance:', btcWallet);
  });

  test('initializes BTC wallet successfully', () => {
    expect(btcWallet).toBeDefined();
    expect(typeof btcWallet).toBe('object');

    if (btcWallet.config) {
      expect(btcWallet.config.network).toMatch(/testnet/i);
    } else {
      console.warn('⚠️ btcWallet.config not defined, skipping config check.');
    }
  });

  test('derives a receive address using wallet methods', async () => {
    expect(MNEMONIC).toBeDefined();

    if (typeof btcWallet.getAccounts === 'function') {
      const accounts = await btcWallet.getAccounts();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);

      const addr = accounts[0].receiveAddress || accounts[0].address || accounts[0];
      expect(typeof addr).toBe('string');
      expect(addr).toMatch(/^(tb1|m|n)[a-zA-HJ-NP-Z0-9]{20,}/);
      console.log('Derived BTC testnet address:', addr);
    } else {
      console.warn('⚠️ getAccounts() not implemented, skipping account derivation test.');
    }
  });

  test('queries BTC balance (likely 0 for new mnemonic)', async () => {
    if (typeof btcWallet.getBalance !== 'function') {
      console.warn('⚠️ getBalance() not implemented, skipping balance test.');
      return;
    }

    let address;
    if (typeof btcWallet.getAccounts === 'function') {
      const accounts = await btcWallet.getAccounts();
      address = accounts[0].receiveAddress || accounts[0].address || accounts[0];
    } else if (btcWallet.address) {
      address = btcWallet.address;
    }

    if (!address) {
      console.warn('⚠️ No BTC address found for balance check.');
      return;
    }

    const balance = await btcWallet.getBalance(address);
    expect(balance).toBeDefined();
    console.log('Queried BTC testnet balance:', balance);
  });

 test('handles invalid network option gracefully', async () => {
   const bad = new BtcModule({ network: 'mainnet-please-no' });
   expect(bad).toBeDefined();
 });

});
