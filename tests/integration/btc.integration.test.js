import dotenv from 'dotenv';
dotenv.config();

import Core from '@tetherto/wdk-core';
import WDK from '@tetherto/wdk-core';
import BtcModule from '@tetherto/wdk-wallet-btc';
import { jest } from '@jest/globals';


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
   // console.log('🔍 BTC Wallet instance:', btcWallet);
  });

  afterAll(async () => {
    if (btcWallet && btcWallet.shutdown) await btcWallet.shutdown();
  });

  test('initializes BTC wallet successfully', () => {
    expect(btcWallet).toBeDefined();
    expect(typeof btcWallet).toBe('object');

    // Directly access _config (private field)
      const config = btcWallet._config;
      expect(config).toBeDefined();

      // Assert the network
      expect(config.network).toMatch(/testnet/i);

      // Assert rpcUrl exists
      expect(config.rpcUrl).toBeDefined();

      console.log('BTC Wallet config:', config);
  });



  test('derives a BTC testnet account/address', async () => {
    expect(btcWallet).toBeDefined();
    expect(typeof btcWallet).toBe('object');

    // Derive the default account using getAccount()
    const account = await btcWallet.getAccount();
    expect(account).toBeDefined();

    // Extract the address string
      const address =
      account?.address ||
      account?.__address ||
      account?.pubkey; // fallback if needed

    expect(address).toBeDefined();
    expect(typeof address).toBe('string');

    // Check address format for testnet (starts with m or n, or bech32 prefix tb1)
    const isValidTestnetAddress =
      /^([mn][1-9A-HJ-NP-Za-km-z]{25,34}|tb1[a-z0-9]{39,59})$/.test(address);
    expect(isValidTestnetAddress).toBe(true);

    console.log('Derived BTC testnet address:', address);
  });

test('queries BTC balance (likely 0 for new mnemonic)', async () => {

if (process.env.CI) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ chain_stats: { funded_txo_sum: 0, spent_txo_sum: 0 } }),
    })
  );
}

  expect(btcWallet).toBeDefined();

  // Derive default account
  const account = await btcWallet.getAccount();
  const address = account?.address || account?.__address || account?.pubkey;
  expect(address).toBeDefined();
  expect(typeof address).toBe('string');

  // Query testnet balance using Blockstream API
  const url = `https://blockstream.info/testnet/api/address/${address}`;
  const response = await fetch(url);
  expect(response.ok).toBe(true);

  const data = await response.json();
  expect(data).toBeDefined();

  const balance = data.chain_stats?.funded_txo_sum - data.chain_stats?.spent_txo_sum || 0;
  console.log(`BTC testnet balance for ${address}:`, balance);

  expect(balance).not.toBeUndefined();
});

 test('handles invalid network option gracefully', async () => {
   const bad = new BtcModule({ network: 'mainnet-please-no' });
   expect(bad).toBeDefined();
 });

});
